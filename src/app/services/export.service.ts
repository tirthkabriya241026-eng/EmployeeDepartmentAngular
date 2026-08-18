import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private http = inject(HttpClient);

  private getBlob(path: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}${path}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  exportEmployeesExcel():   Observable<HttpResponse<Blob>> { return this.getBlob('/api/Employee/export/excel'); }
  exportEmployeesPdf():     Observable<HttpResponse<Blob>> { return this.getBlob('/api/Employee/export/pdf'); }
  exportDepartmentsExcel(): Observable<HttpResponse<Blob>> { return this.getBlob('/api/Department/export/excel'); }
  exportDepartmentsPdf():   Observable<HttpResponse<Blob>> { return this.getBlob('/api/Department/export/pdf'); }
}
