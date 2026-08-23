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

import {
  getAllLecturers,
} from "@/features/action/usersThunk"

import { MahasiswaField } from "./mahasiswa-form"

import { AlertDestructive } from "../alert-form"
import { DosenField } from "./dosen-form"
import { FakultasField } from "./fakultas-form"
import { ProdiField } from "./prodi-form"
import RuanganField from "./ruangan-form"


type EntityType =
  | "mahasiswa"
  | "dosen"
  | "fakultas"
  | "prodi"
  | "matkul"
  | "ruangan"


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
} as const


export function DialogForm() {
  const { pathname } = useLocation()

  const dispatch = useAppDispatch()

  const entityType = getEntityType(pathname)
  const entity = entityConfig[entityType]

  const { fakultas, prodi } = useAppSelector(
    (state) => state.campus
  )

  const { lecturers } = useAppSelector(
    (state) => state.users
  )

  const [dialogOpen, setDialogOpen] = useState(false)

  // const [selectedFakultasId, setSelectedFakultasId] =
  //   useState<number | null>(null)

  // const [selectedProdiId, setSelectedProdiId] =
  //   useState<number | null>(null)

  // const [selectedDosenId, setSelectedDosenId] =
  //   useState<string | null>(null)

  const [isConfirmed, setIsConfirmed] =
    useState(false)

  const [submitError, setSubmitError] =
    useState<string | null>(null)

  useEffect(() => {
    dispatch(getAllFakultas())
  }, [dispatch])


  // useEffect(() => {
  //   setSelectedProdiId(null)
  //   setSelectedDosenId(null)

  //   // if (!selectedFakultasId) {
  //   //   return
  //   // }

  //   dispatch(
  //     getAllProdi({
  //       fakultasId: selectedFakultasId,
  //     })
  //   )
  // }, [selectedFakultasId, dispatch])


  // useEffect(() => {
  //   setSelectedDosenId(null)

  //   if (!selectedProdiId) {
  //     return
  //   }

  //   dispatch(
  //     getAllLecturers({
  //       prodiId: selectedProdiId,
  //     })
  //   )
  // }, [selectedProdiId, dispatch])


  const handleClose = () => {
    setDialogOpen(false)
    // setSelectedFakultasId(null)
    // setSelectedProdiId(null)
    // setSelectedDosenId(null)
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

          // selectedFakultasId={selectedFakultasId}
          // setSelectedFakultasId={setSelectedFakultasId}

          // selectedProdiId={selectedProdiId}
          // setSelectedProdiId={setSelectedProdiId}

          // selectedDosenId={selectedDosenId}
          // setSelectedDosenId={setSelectedDosenId}

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

          selectedFakultasId={selectedFakultasId}
          setSelectedFakultasId={setSelectedFakultasId}

          selectedProdiId={selectedProdiId}
          setSelectedProdiId={setSelectedProdiId}

          selectedDosenId={selectedDosenId}
          setSelectedDosenId={setSelectedDosenId}

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
            disabled={!isConfirmed}
          >
            Save changes
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}