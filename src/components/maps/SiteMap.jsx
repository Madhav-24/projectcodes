import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
});

const ennoreLocation = [13.149, 80.298];

function SiteMap({ sites }) {
  return (
    <div className="h-[420px] rounded-[32px] bg-slate-950 border border-slate-700 shadow-card">
      <MapContainer center={ennoreLocation} zoom={12} scrollWheelZoom={false} className="h-full w-full rounded-[32px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={ennoreLocation}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.85 }}
          radius={10}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">Chennai Ennore Port</p>
              <p className="text-xs text-slate-500">Highlighted site focus</p>
            </div>
          </Popup>
        </CircleMarker>
        {sites.map((site) => (
          <Marker key={site.id} position={[site.location.lat, site.location.lng]} icon={defaultIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{site.siteName}</p>
                <p className="text-xs">{site.workType}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default SiteMap;
