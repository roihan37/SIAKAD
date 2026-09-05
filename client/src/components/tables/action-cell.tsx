import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeIcon, MoreHorizontal, PencilIcon, ShareIcon, TrashIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ActionCellProps<T> = {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onDetail?: (row: T) => void;
  detailPath?: (row: T) => string;
};

export function ActionCell<T>({ row, onEdit, onDelete, onDetail, detailPath }: ActionCellProps<T>) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline"><MoreHorizontal /></Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {(detailPath || onDetail) && <DropdownMenuItem onClick={() => detailPath ? navigate(detailPath(row)) : onDetail?.(row)}>
            <EyeIcon />
            Lihat Detail
          </DropdownMenuItem>}
          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(row)}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}