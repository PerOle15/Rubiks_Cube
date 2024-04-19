export default [
  // {
  //   name: 'environmentMapTexture',
  //   type: 'cubeTexture',
  //   path: [
  //     'textures/environmentMap/px.jpg',
  //     'textures/environmentMap/nx.jpg',
  //     'textures/environmentMap/py.jpg',
  //     'textures/environmentMap/ny.jpg',
  //     'textures/environmentMap/pz.jpg',
  //     'textures/environmentMap/nz.jpg',
  //   ],
  // },
  {
    name: 'environmentMapTexture',
    type: 'hdrEnvironmentMap',
    path: 'textures/environmentMap/blender-2k.hdr',
  },
  {
    name: 'grassColorTexture',
    type: 'texture',
    path: 'textures/dirt/color.jpg',
  },
  {
    name: 'grassNormalTexture',
    type: 'texture',
    path: 'textures/dirt/normal.jpg',
  },
]
