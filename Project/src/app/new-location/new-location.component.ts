import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { IUploadedFile } from '../models/upload-file.model';
import { Observable, Observer, from, of} from 'rxjs';
import { concatMap, catchError, take } from 'rxjs/operators';

const INVALID_FILE = ' Invalid file.';
const INVALID_IMAGE = ' Invalid image.';
const INVALID_SIZE = ' Invalid Size.';

@Component({
  selector: 'app-new-location',
  templateUrl: './new-location.component.html',
  styleUrls: ['./new-location.component.scss']
})
export class NewLocationComponent implements OnInit{
  locationTypes = ['Home', 'Business', 'Event'];
  locationForm: FormGroup;
  uploadedLogo;
  validLogo = true;
  @Output() uploadedFiles: EventEmitter<IUploadedFile> = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<NewLocationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ){}

  ngOnInit(): void {
    if(this.data.mode === 'create'){
      this.locationForm = new FormGroup({
        name: new FormControl(null, Validators.required),
        location: new FormControl(this.data.details.latlng, Validators.required),
        type: new FormControl(null, Validators.required),
        logo: new FormControl(null),
      })
    } else if(this.data.mode === 'edit'){      
      this.locationForm = new FormGroup({
        name: new FormControl(this.data.details.formDetails.name, Validators.required),
        location: new FormControl(this.data.details.formDetails.location, Validators.required),
        type: new FormControl(this.data.details.formDetails.type, Validators.required),
        logo: new FormControl(null),
      })
      this.uploadedLogo = this.data.details.logo
    }
  }

  saveNewLocation(){
    this.dialogRef.close({
      formDetails: this.locationForm.value,
      logo: this.uploadedLogo
    })
  }

  cancel(){
    this.dialogRef.close()
  }

  uploadFiles(event: any): void {
    const files = event?.target?.files;
    
    from(files)
    .pipe(
      concatMap((file) => this.validateFile(file).pipe(catchError((error: IUploadedFile) => of(error)))),
      take(1)
    )
    .subscribe((validatedFile: IUploadedFile) => {
      if(validatedFile.error){
        this.validLogo = false;
        window.alert(validatedFile.error.errorMessage);
      }
      else this.validLogo = true
      // this.uploadedFiles.emit(validatedFile);
    }),
    catchError((error: IUploadedFile) => of(error))
  }

  private validateFile(file): Observable<IUploadedFile> {
    const fileReader = new FileReader();
    const { type, name } = file;
    return new Observable((observer: Observer<IUploadedFile>) => {
      this.validateSize(file, observer);
      fileReader.readAsDataURL(file);
      fileReader.onload = event => {
        if (this.isImage(type)) {
          const image = new Image();
          image.onload = () => {
            observer.next({ file });
            observer.complete();
          };
          image.onerror = () => {
            observer.error({ error: { name, errorMessage: INVALID_IMAGE } });
          };
          image.src = fileReader.result as string;
          this.uploadedLogo = event.target?.result;
        } else {
          observer.next({ file });
          observer.complete();
        }
      };
      fileReader.onerror = () => {
        observer.error({ error: { name, errorMessage: INVALID_FILE } });
      };
    });
  }

  private isImage(mimeType: string): boolean {
    return mimeType.match(/image\/*/) !== null;
  }

  private validateSize(file: File, observer: Observer<IUploadedFile>): void {
    const {name, size} = file;
    if (!this.isValidSize(size)) {
      observer.error({error: {name, errorMessage: INVALID_SIZE}});
    }
  }

  private isValidSize(size: number): boolean {
    const toKByte = size / 1024;
    return toKByte >= 1 && toKByte <= 100;
    
  }

}
