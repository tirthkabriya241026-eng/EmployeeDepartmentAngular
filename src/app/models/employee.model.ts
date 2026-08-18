

export interface Employee {
  empId:          number;
  name:           string;
  email:          string;
  salary:         number;
  deptId:         number;
  managerId:      number | null;
  departmentName: string | null;
  managerName:    string | null;
  department:     { deptId: number; deptName: string; location: string; isActive: boolean } | null;
  manager:        Employee | null;
  isActive:       boolean;
  isDeleted:      boolean;
  createdAt:      string | null;
  createdDate:    string | null;
  updatedDate:    string | null;
  createdBy:      string | null;
  updatedBy:      string | null;
}


export interface EmployeeRequest {
  name:      string;
  email:     string;
  salary:    number;
  deptId:    number;
  managerId: number | null;
}
