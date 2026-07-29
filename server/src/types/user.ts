export interface SelectUser {
    id: boolean;
    name: boolean;
    email: boolean;
    role: boolean;
    gender: boolean;
    mahasiswa?: {
        select: {
            id: boolean;
            nim: boolean;
            status: boolean;
        };
    },
    dosen?: {
        select: {
            id: boolean;
            nidn: boolean;
            status: boolean;
            jabatan : boolean
        };
    };
}