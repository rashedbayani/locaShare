import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Map, Control, DomUtil, ZoomAnimEvent , Layer, MapOptions, tileLayer, latLng, LeafletEvent, Marker, circle, polygon, marker, icon, Icon, divIcon, DomEvent } from 'leaflet';
import { MatDialog } from '@angular/material/dialog';
import { NewLocationComponent } from '../new-location/new-location.component';


@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss']
})
export class LeafletMapComponent implements OnInit, OnDestroy {
  constructor(
    private dialog: MatDialog
  ){}
  @Output() map$: EventEmitter<Map> = new EventEmitter;
  @Output() zoom$: EventEmitter<number> = new EventEmitter;
  @Input() options: MapOptions= {
                      layers:[tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        opacity: 1,
                        maxZoom: 19,
                        detectRetina: true,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      })],
                      zoom:14,
                      center:latLng(51.2404030496661, -0.6119522539693528)
  };
  public map: Map;
  public zoom: number;
  public markers: Marker;
  public layers: any[] = [];

  regularLocation = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" class="regular-loc"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`

  ngOnInit() {
    this.markers = marker([ 51.2404030496661, -0.6119522539693528 ], {
      icon: divIcon({html: this.regularLocation})
    })

    this.layers.push(this.markers)
  }

  ngOnDestroy() {
    this.map.clearAllEventListeners;
    this.map.remove();
  };

  onMapReady(map: Map) {
    this.map = map;
    this.map.doubleClickZoom.disable()
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
  }

  onMapZoomEnd(e: LeafletEvent) {
    this.zoom = e.target.getZoom();
    this.zoom$.emit(this.zoom);
  }

  addNewLocation(event: LeafletEvent){
    let locationDialog = this.dialog.open(NewLocationComponent, {
      data: {
        mode: 'create',
        details: event
      },
      width: '40vw',
      minWidth: '340px',
      autoFocus: false
    })

    locationDialog.afterClosed().subscribe(res => {
      if(res){
        let popupContent = DomUtil.create('div'); 
        popupContent.setAttribute('class', 'popup-content')
              
        this.createPopupDetail('Location Name', popupContent, res.formDetails.name)
        this.createPopupDetail('Location Type', popupContent, res.formDetails.type)
        this.createPopupDetail('Location Coordinates', popupContent, res.formDetails.location)

        let btnWrapper = DomUtil.create('div', '', popupContent);
        btnWrapper.setAttribute('class', 'popup-btn-wrapper');

        let editBtn = this.createButton('Edit', btnWrapper, 'primary');
        let deleteBtn = this.createButton('Delete', btnWrapper, 'secondary');

        DomEvent.on(editBtn, 'click', () => {
          this.dialog.open(NewLocationComponent, {
            data: {
              mode: 'edit',
              details: res
            },
            width: '40vw',
            minWidth: '340px'
          });
        });
        
        if(res.logo){          
          DomEvent.on(deleteBtn, 'click', () => {
            this.map.removeLayer(mark)
          });
          let mark = marker(res.formDetails.location, {
            icon: divIcon({html: this.uploadedLogo(res.logo)}),
          }).addTo(this.map).bindPopup(popupContent).bindTooltip(res.formDetails.name)
        } else {
          DomEvent.on(deleteBtn, 'click', () => {
            this.map.removeLayer(mark)
          });
          let mark = marker(res.formDetails.location, {
            icon: divIcon({html: this.regularLocation}),
            title: res.name
          }).addTo(this.map).bindPopup(popupContent).bindTooltip(res.formDetails.name)
        }

        
      }
    })
  }

  edit(){
    console.log('edit');
    
  }

  createButton(label: string, container: any, className: string) {
    var btn = DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.setAttribute('class', className);
    btn.innerHTML = label;
    return btn;
    }
  
  createPopupDetail(label: string, container: any, value: string){
    var detail = DomUtil.create('div', '', container);
    detail.setAttribute('class', 'detail-row');
    detail.innerHTML = label + ':' + value;
    return detail;
  }

  uploadedLogo(imageCode){
    return `<img src="${imageCode}" alt="" class="uploaded-logo">`
    // return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" class="regular-loc"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
  }
}
