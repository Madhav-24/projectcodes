// Module: Camera Sites
// Purpose: Store shared site and camera metadata for role camera pages.
export const CAMERA_SITES = [
  {
    id: 'site1',
    name: 'Site 1 - Earthwork & Structural',
    status: 'On Track',
    icon: 'helmet',
    cameras: [
      { id: 1, name: 'Main Entrance', status: 'LIVE', streamId: 'CAM-01', details: ['8 Persons', '2 Helmets'] },
      { id: 2, name: 'Excavation A', status: 'LIVE', streamId: 'CAM-02', details: ['3 Machines', '5 Workers'] },
    ],
  },
  {
    id: 'site2',
    name: 'Site 2 - Girder Casting Yard',
    status: 'Caution',
    icon: 'tools',
    cameras: [
      { id: 3, name: 'Casting Yard A', status: 'LIVE', streamId: 'CAM-03', details: ['4 Workers', '1 Crane'] },
      { id: 4, name: 'Storage Zone', status: 'OFFLINE', streamId: 'CAM-04', details: ['--', '--'] },
    ],
  },
  {
    id: 'site3',
    name: 'Site 3 - Piling Process',
    status: 'Delayed',
    icon: 'construction',
    cameras: [{ id: 5, name: 'Piling Site', status: 'LIVE', streamId: 'CAM-05', details: ['2 Workers', '1 Rig'] }],
  },
];
