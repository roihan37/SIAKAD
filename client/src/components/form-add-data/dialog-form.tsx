import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"

import {
  getAllFakultas,
  getAllProdi,
} from "@/features/action/campusThunk"

import { MahasiswaField } from "./mahasiswa-form"

import { AlertDestructive } from "../alert-form"
import { DosenField } from "./dosen-form"
import { FakultasField } from "./fakultas-form"
import { ProdiField } from "./prodi-form"
import RuanganField from "./ruangan-form"
import { Spinner } from "../ui/spinner"
import MatkulField from "./matkul-form"
import { TAkademikField } from "./tAkademik-form"
import KurikulumField from "./kurikulum-form"


type EntityType =
  | "mahasiswa"
  | "dosen"
  | "fakultas"
  | "prodi"
  | "matkul"
  | "ruangan"
  | "tAkademik"
  | "kurikulum"


const getEntityType = (pathname: string): EntityType => {
  if (pathname.startsWith("/fakultas")) {
    return "fakultas"
  }
  if (
    pathname.startsWith("/program-studi")
    // pathname.startsWith("/prodi")
  ) {
    return "prodi"
  }

  if (pathname.startsWith("/dosen")) {
    return "dosen"
  }

  if (pathname.startsWith("/mata-kuliah")) {
    return "matkul"
  }

  if (pathname.startsWith("/ruangan")) {
    return "ruangan"
  }

  if (pathname.startsWith("/tahun-akademik")) {
    return "tAkademik"
  }

  if (pathname.startsWith("/kurikulum")) {
    return "kurikulum"
  }

  return "mahasiswa"
}


const entityConfig = {
  mahasiswa: {
    label: "Mahasiswa",
    formId: "mahasiswa-form",
  },
  dosen: {
    label: "Dosen",
    formId: "dosen-form",
  },
  fakultas: {
    label: "Fakultas",
    formId: "fakultas-form",
  },
  prodi: {
    label: "Prodi",
    formId: "prodi-form",
  },
  matkul: {
    label: "Mata Kuliah",
    formId: "mata-kuliah-form",
  },
  ruangan: {
    label: "Ruangan",
    formId: "ruangan-form",
  },
  tAkademik: {
    label: "Tahun Akademik",
    formId: "tahun-akademik-form",
  },
  kurikulum: {
    label: "Kurikulum",
    formId: "kurikulum-form",
  },
} as const


export function DialogForm() {
  const { pathname } = useLocation()

  const dispatch = useAppDispatch()
  const { isCreatingStudent, isCreatingLecturer } = useAppSelector((state) => state.users)
  const { isCreatingProdi, isCreatingFakultas } = useAppSelector((state) => state.campus)
  const { isCreatingKurikulum } = useAppSelector((state) => state.kurikulum)
  const { isCreatingMatkul } = useAppSelector((state) => state.matkul)
  const { isCreatingRuangan } = useAppSelector((state) => state.ruangan)
  const { isCreatingTAkademik } = useAppSelector((state) => state.tAkademik)
  const entityType = getEntityType(pathname)
  const entity = entityConfig[entityType]

  const isCreating =
    isCreatingStudent ||
    isCreatingLecturer ||
    isCreatingFakultas ||
    isCreatingKurikulum ||
    isCreatingMatkul ||
    isCreatingProdi ||
    isCreatingRuangan ||
    isCreatingTAkademik

  const { fakultas, prodi } = useAppSelector(
    (state) => state.campus
  )

  const { lecturers } = useAppSelector(
    (state) => state.users
  )

  const [dialogOpen, setDialogOpen] = useState(false)

  const [isConfirmed, setIsConfirmed] =
    useState(false)

  const [submitError, setSubmitError] =
    useState<string | null>(null)

  useEffect(() => {
    dispatch(getAllFakultas())
    dispatch(getAllProdi())
  }, [dispatch])


  const handleClose = () => {
    setDialogOpen(false)
    setIsConfirmed(false)
    setSubmitError(null)
  }


  /*
   * Untuk tahap pertama kita hanya render
   * MahasiswaField.
   *
   * Form lain nanti kita refactor satu per satu.
   */
  const renderForm = () => {
    if (entityType === "mahasiswa") {
      return (
        <MahasiswaField
          fakultas={fakultas}
          prodi={prodi}
          lecturers={lecturers}

          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}

          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "dosen") {
      return (
        <DosenField
          fakultas={fakultas}
          prodi={prodi}

          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}

          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "fakultas") {
      return (
        <FakultasField
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "prodi") {
      return (
        <ProdiField
          fakultas={fakultas}
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "ruangan") {
      return (
        <RuanganField
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "matkul") {
      return (
        <MatkulField
          prodi={prodi}
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "tAkademik") {
      return (
        <TAkademikField
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    else if (entityType === "kurikulum") {
      return (
        <KurikulumField
          isConfirmed={isConfirmed}
          setIsConfirmed={setIsConfirmed}
          onSuccess={handleClose}
          onError={setSubmitError}
        />
      )
    }

    return null
  }


  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    >

      <DialogTrigger
        render={
          <Button
            variant="outline"
            type="button"
          >
            Add {entity.label}
          </Button>
        }
      />

      <DialogContent
        className="sm:max-w-sm flex max-h-[85vh] flex-col p-0 gap-0"
      >

        <DialogHeader className="p-6 pb-4">

          <DialogTitle>
            Add {entity.label}
          </DialogTitle>

          <DialogDescription>
            Isi data {entity.label.toLowerCase()} baru
            di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>

          {submitError && (
            <AlertDestructive
              title={submitError}
            />
          )}

        </DialogHeader>


        <div className="flex-1 overflow-y-auto px-6 mb-5">

          {renderForm()}

        </div>


        <DialogFooter className="p-6 pt-4 border-t">

          <DialogClose
            render={
              <Button
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
            }
          />

          <Button
            type="submit"
            form={entity.formId}
            disabled={!isConfirmed || isCreating}
          >
            {isCreating ? (
              <>
                <Spinner data-icon="inline-start" />
                Processing...
              </>
            ) : (
              "Save changes"
            )}
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}