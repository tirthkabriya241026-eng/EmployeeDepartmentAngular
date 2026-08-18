
export interface Department {
  deptId:        number;
  deptName:      string;
  location:      string;
  employeeCount: number;
  isActive:      boolean;
  isDeleted:     boolean;
  employees:     any[];
  createdDate:   string | null;
  updatedDate:   string | null;
  createdBy:     string | null;
  updatedBy:     string | null;
}


export interface DepartmentRequest {
  deptId?:  number;
  deptName: string;
  location: string;
}
