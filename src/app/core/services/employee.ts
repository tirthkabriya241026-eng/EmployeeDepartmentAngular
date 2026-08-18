import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Employee, EmployeeRequest } from '../../models/employee.model';


export interface EmployeeOption {
  empId: number;
  name:  string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {

  private readonly url = `${environment.apiUrl}/api/Employee`;
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

 
  private unwrap(res: any): any[] {
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  }

  
  getAll(): Observable<Employee[]> {
    return this.http.get<any>(`${this.url}?pageSize=1000&pageNumber=1`).pipe(
      map((r: any) => this.unwrap(r) as Employee[]),
      catchError(this.handleError)
    );
  }

  
  getDeleted(): Observable<Employee[]> {
    return this.http.get<any>(`${this.url}/deleted`).pipe(
      map((r: any) => this.unwrap(r) as Employee[]),
      catchError(() => of([] as Employee[]))
    );
  }

  
  getById(id: number): Observable<Employee> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      map((r: any) => (r?.data ?? r) as Employee),
      catchError(this.handleError)
    );
  }

  
  getForDropdown(excludeId?: number): Observable<EmployeeOption[]> {
    return this.http.get<any>(`${this.url}?pageSize=1000&pageNumber=1`).pipe(
      map((r: any) => {
        const list = this.unwrap(r) as Employee[];
        return list
          .filter((e: Employee) =>
            !e.isDeleted &&
            e.isActive !== false &&
            (excludeId == null || e.empId !== excludeId)
          )
          .map((e: Employee) => ({ empId: e.empId, name: e.name }));
      }),
      catchError(() => of([] as EmployeeOption[]))
    );
  }

  
  create(data: EmployeeRequest): Observable<Employee> {
    return this.http.post<any>(this.url, data, { headers: this.jsonHeaders }).pipe(
      map((r: any) => (r?.data ?? r) as Employee),
      catchError(this.handleError)
    );
  }

  
  update(id: number, data: EmployeeRequest): Observable<Employee> {
    return this.http.put<any>(`${this.url}/${id}`, data, { headers: this.jsonHeaders }).pipe(
      map((r: any) => (r?.data ?? r) as Employee),
      catchError(this.handleError)
    );
  }

  
  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  
  restore(id: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/restore`, {}, { headers: this.jsonHeaders }).pipe(
      catchError(this.handleError)
    );
  }

  
  toggleStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(
      `${this.url}/${id}/status`,
      { isActive },
      { headers: this.jsonHeaders }
    ).pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let message = 'An unexpected error occurred.';
    if (error.status === 0) {
      message = 'Cannot connect to server. Please check your connection.';
    } else if (error.status === 401) {
      message = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      message = 'Access denied. Admin role required.';
    } else if (error.status === 404) {
      message = 'Resource not found.';
    } else if (error.status === 409) {
      message = error.error?.message ?? 'A conflict occurred (duplicate entry).';
    } else if (error.status === 400) {
      const e = error.error;
      if (e?.errors)              { message = Object.values(e.errors as Record<string, string[]>).flat().join(' '); }
      else if (e?.message)        { message = e.message; }
      else if (typeof e === 'string') { message = e; }
    } else {
      message = error.error?.message ?? 'An unexpected error occurred.';
    }
    return throwError(() => new Error(message));
  };
}
