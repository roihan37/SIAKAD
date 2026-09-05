"use client";

import { Button } from "@/components/ui/button";
import { CropIcon, RotateCcwIcon } from "lucide-react";
import { Slot } from "radix-ui";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
  type ReactCropProps,
} from "react-image-crop";
import { cn } from "@/lib/utils";

import "react-image-crop/dist/ReactCrop.css";

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_SIZE = 1024;
const DEFAULT_OUTPUT_QUALITY = 0.85;

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect?: number
): PercentCrop => {
  return centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        )
      : {
          unit: "%",
          x: 0,
          y: 0,
          width: 90,
          height: 90,
        },
    mediaWidth,
    mediaHeight
  );
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
};

const getCroppedImage = async (
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  maxImageSize: number,
  maxOutputSize = DEFAULT_MAX_OUTPUT_SIZE
): Promise<string> => {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropWidth = Math.round(pixelCrop.width * scaleX);
  const cropHeight = Math.round(pixelCrop.height * scaleY);

  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error("Invalid crop dimensions.");
  }

  /**
   * Jangan menghasilkan gambar lebih besar dari yang dibutuhkan.
   * Untuk avatar mahasiswa, 1024x1024 sudah lebih dari cukup.
   */
  const resizeFactor = Math.min(
    1,
    maxOutputSize / Math.max(cropWidth, cropHeight)
  );

  let outputWidth = Math.round(cropWidth * resizeFactor);
  let outputHeight = Math.round(cropHeight * resizeFactor);

  /**
   * Pastikan minimal 1 pixel.
   */
  outputWidth = Math.max(1, outputWidth);
  outputHeight = Math.max(1, outputHeight);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is not available.");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  /**
   * Untuk foto, smoothing sebaiknya aktif.
   */
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  /**
   * JPEG lebih cocok untuk foto dibanding PNG.
   */
  let quality = DEFAULT_OUTPUT_QUALITY;

  let blob = await canvasToBlob(
    canvas,
    "image/jpeg",
    quality
  );

  /**
   * Turunkan quality jika masih terlalu besar.
   */
  while (blob.size > maxImageSize && quality > 0.45) {
    quality -= 0.1;

    blob = await canvasToBlob(
      canvas,
      "image/jpeg",
      quality
    );
  }

  /**
   * Jika masih terlalu besar setelah quality diturunkan,
   * kecilkan resolusi secara bertahap.
   */
  while (blob.size > maxImageSize && outputWidth > 256) {
    outputWidth = Math.round(outputWidth * 0.8);
    outputHeight = Math.round(outputHeight * 0.8);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    quality = 0.75;

    blob = await canvasToBlob(
      canvas,
      "image/jpeg",
      quality
    );
  }

  return URL.createObjectURL(blob);
};

type ImageCropContextType = {
  file: File;
  maxImageSize: number;
  imgSrc: string;

  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;

  imgRef: RefObject<HTMLImageElement | null>;

  onCrop?: (croppedImage: string) => void;

  reactCropProps: Omit<
    ReactCropProps,
    "onChange" | "onComplete" | "children"
  >;

  handleChange: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => void;

  handleComplete: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => void;

  onImageLoad: (
    e: SyntheticEvent<HTMLImageElement>
  ) => void;

  applyCrop: () => Promise<void>;

  resetCrop: () => void;
};

const ImageCropContext =
  createContext<ImageCropContextType | null>(null);

const useImageCrop = () => {
  const context = useContext(ImageCropContext);

  if (!context) {
    throw new Error(
      "ImageCrop components must be used within ImageCrop"
    );
  }

  return context;
};

export type ImageCropProps = {
  file: File;

  /**
   * Maksimum ukuran hasil akhir.
   * Default: 5 MB
   */
  maxImageSize?: number;

  /**
   * Maksimum resolusi hasil.
   * Default: 1024px
   */
  maxOutputSize?: number;

  onCrop?: (croppedImage: string) => void;

  children: ReactNode;

  onChange?: ReactCropProps["onChange"];

  onComplete?: ReactCropProps["onComplete"];
} & Omit<
  ReactCropProps,
  "onChange" | "onComplete" | "children"
>;

export const ImageCrop = ({
  file,
  maxImageSize = DEFAULT_MAX_FILE_SIZE,
  maxOutputSize = DEFAULT_MAX_OUTPUT_SIZE,
  onCrop,
  children,
  onChange,
  onComplete,
  ...reactCropProps
}: ImageCropProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgSrc, setImgSrc] = useState("");

  const [crop, setCrop] =
    useState<PercentCrop>();

  const [completedCrop, setCompletedCrop] =
    useState<PixelCrop | null>(null);

  const [initialCrop, setInitialCrop] =
    useState<PercentCrop>();

  /**
   * Gunakan object URL untuk preview file.
   */
  useEffect(() => {
    if (!file) {
      setImgSrc("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setImgSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      const newCrop = centerAspectCrop(
        width,
        height,
        reactCropProps.aspect
      );

      setCrop(newCrop);
      setInitialCrop(newCrop);
      setCompletedCrop(null);
    },
    [reactCropProps.aspect]
  );

  const handleChange = (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => {
    setCrop(percentCrop);

    onChange?.(
      pixelCrop,
      percentCrop
    );
  };

  const handleComplete = (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => {
    setCompletedCrop(pixelCrop);

    onComplete?.(
      pixelCrop,
      percentCrop
    );
  };

  const applyCrop = async () => {
    if (!imgRef.current || !completedCrop) {
      return;
    }

    const croppedImage = await getCroppedImage(
      imgRef.current,
      completedCrop,
      maxImageSize,
      maxOutputSize
    );

    onCrop?.(croppedImage);
  };

  const resetCrop = () => {
    if (!initialCrop) {
      return;
    }

    setCrop(initialCrop);
    setCompletedCrop(null);
  };

  const contextValue: ImageCropContextType = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop,
  };

  return (
    <ImageCropContext.Provider value={contextValue}>
      {children}
    </ImageCropContext.Provider>
  );
};

export type ImageCropContentProps = {
  style?: CSSProperties;
  className?: string;
};

export const ImageCropContent = ({
  style,
  className,
}: ImageCropContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useImageCrop();

  const shadcnStyle = {
    "--rc-border-color": "var(--color-border)",
    "--rc-focus-color": "var(--color-primary)",
  } as CSSProperties;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30",
        className
      )}
      style={style}
    >
      <ReactCrop
        crop={crop}
        onChange={handleChange}
        onComplete={handleComplete}
        className="max-h-[420px] max-w-full"
        style={shadcnStyle}
        {...reactCropProps}
      >
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Preview foto mahasiswa"
            onLoad={onImageLoad}
            className="block h-auto max-h-[420px] max-w-full object-contain"
          />
        )}
      </ReactCrop>
    </div>
  );
};

export type ImageCropApplyProps =
  ComponentProps<"button"> & {
    asChild?: boolean;
  };

export const ImageCropApply = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropApplyProps) => {
  const { applyCrop } = useImageCrop();

  const handleClick = async (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    await applyCrop();

    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot.Root
        onClick={handleClick}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <CropIcon className="size-4" />
      )}
    </Button>
  );
};

export type ImageCropResetProps =
  ComponentProps<"button"> & {
    asChild?: boolean;
  };

export const ImageCropReset = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropResetProps) => {
  const { resetCrop } = useImageCrop();

  const handleClick = (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    resetCrop();

    onClick?.(e);
  };

  if (asChild) {
    return (
      <Slot.Root
        onClick={handleClick}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <RotateCcwIcon className="size-4" />
      )}
    </Button>
  );
};

/**
 * Backward compatibility
 */
export type CropperProps =
  Omit<ReactCropProps, "onChange"> & {
    file: File;
    maxImageSize?: number;
    maxOutputSize?: number;
    onCrop?: (croppedImage: string) => void;
    onChange?: ReactCropProps["onChange"];
  };

export const Cropper = ({
  onChange,
  onComplete,
  onCrop,
  style,
  className,
  file,
  maxImageSize,
  maxOutputSize,
  ...props
}: CropperProps) => {
  return (
    <ImageCrop
      file={file}
      maxImageSize={maxImageSize}
      maxOutputSize={maxOutputSize}
      onChange={onChange}
      onComplete={onComplete}
      onCrop={onCrop}
      {...props}
    >
      <ImageCropContent
        className={className}
        style={style}
      />
    </ImageCrop>
  );
};