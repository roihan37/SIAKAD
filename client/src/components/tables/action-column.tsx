"use client"
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  ShareIcon,
} from "lucide-react";

import { type ColumnDef } from "@tanstack/react-table";

export function createActionColumn<T>(
  _onEdit?: (row: T) => void,
  _onDelete?: (row: T) => void,
  _onDetail?: (row: T) => void
): ColumnDef<T> {

  return {
    id: "actions",

    cell: () => {

      return (

        <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline"><MoreHorizontal /></Button>} />
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>
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
            <DropdownMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      );

    },

  };

}