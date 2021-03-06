import EventsEmitter from './eventsEmitter'

const Autodesk = window.Autodesk;
const THREE = window.THREE;

export default class RotateTool extends EventsEmitter {

  /////////////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////////////
  constructor (viewer) {

    super()

    this.keys = {}

    this.active = false

    this.viewer = viewer

    this.fullTransform = false

    this._hitPoint = new THREE.Vector3()

    this.viewer.toolController.registerTool(this)

    this.onAggregateSelectionChangedHandler = (e) => {

      this.onAggregateSelectionChanged(e)
    }
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  enable (enable) {

    var name = this.getName()

    if (enable) {

      this.viewer.toolController.activateTool(name)

    } else {

      this.viewer.toolController.deactivateTool(name)
    }
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  getNames () {

    return ['Viewing.Rotate.Tool']
  }

  /////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////
  getName () {

    return 'Viewing.Rotate.Tool'
  }

  ///////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////
  activate () {

    if (!this.active) {

      this.active = true

      this.viewer.addEventListener(
        Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
        this.onAggregateSelectionChangedHandler)
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  // deactivate tool
  //
  ///////////////////////////////////////////////////////////////////////////
  deactivate () {

    if (this.active) {

      this.active = false

      if (this.rotateControl) {

        this.rotateControl.remove()
        this.rotateControl = null
      }

      this.viewer.removeEventListener(
        Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
        this.onAggregateSelectionChangedHandler)
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  onAggregateSelectionChanged (event) {

    if (this.rotateControl && this.rotateControl.engaged) {

      this.rotateControl.engaged = false

      //this.viewer.select(this.selection.dbIdArray)

      return
    }

    if (event.selections && event.selections.length) {

      var selection = event.selections[0]

      this.setSelection(selection)

    } else {

      this.clearSelection()
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  setSelection(selection) {

    this.selection = selection

    this.emit('transform.modelSelected',
      this.selection)

    if (this.fullTransform) {

      this.selection.fragIdsArray = []

      var fragCount = selection.model.getFragmentList().
        fragments.fragId2dbId.length

      for (var fragId = 0; fragId < fragCount; ++fragId) {

        this.selection.fragIdsArray.push(fragId)
      }

      this.selection.dbIdArray = []

      var instanceTree = selection.model.getData().instanceTree

      var rootId = instanceTree.getRootId()

      this.selection.dbIdArray.push(rootId)

      this.drawAxis()

    } else {

      this.drawAxis()
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  clearSelection() {

    this.selection = null

    if (this.rotateControl) {

      this.rotateControl.remove()

      this.rotateControl = null

      this.viewer.impl.sceneUpdated(true)
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  drawAxis () {

    var bBox = this.geWorldBoundingBox(
      this.selection.fragIdsArray,
      this.selection.model.getFragmentList())

    this.center = new THREE.Vector3(
      (bBox.min.x + bBox.max.x) / 2,
      (bBox.min.y + bBox.max.y) / 2,
      (bBox.min.z + bBox.max.z) / 2)

    var size = Math.max(
        bBox.max.x - bBox.min.x,
        bBox.max.y - bBox.min.y,
        bBox.max.z - bBox.min.z) * 0.8

    if (this.rotateControl) {

      this.rotateControl.remove()
    }

    this.rotateControl = new RotateControl(
      this.viewer, this.center, size)

    this.rotateControl.on('transform.rotate', (data) => {

      this.rotateFragments(
        this.selection.model,
        this.selection.fragIdsArray,
        data.axis,
        data.angle,
        this.center)

      this.viewer.impl.sceneUpdated(true)
    })
  }

  ///////////////////////////////////////////////////////////////////////////
  // get 3d hit point on mesh
  //
  ///////////////////////////////////////////////////////////////////////////
  getHitPoint (event) {

    var screenPoint = {
      x: event.clientX,
      y: event.clientY
    }

    var n = this.normalize(screenPoint)

    var hitPoint = this.viewer.utilities.getHitPoint(n.x, n.y)

    return hitPoint
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  hitPoint () {

    return this._hitPoint
  }

  ///////////////////////////////////////////////////////////////////////////
  // normalize screen coordinates
  //
  ///////////////////////////////////////////////////////////////////////////
  normalize (screenPoint) {

    var viewport = this.viewer.navigation.getScreenViewport()

    var n = {
      x: (screenPoint.x - viewport.left) / viewport.width,
      y: (screenPoint.y - viewport.top) / viewport.height
    }

    return n
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  setHitPoint (hitPoint) {

    this._hitPoint.copy(hitPoint)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  handleButtonDown (event, button) {

    if (this.rotateControl) {

      if (this.rotateControl.onPointerDown(event)) {

        return true
      }
    }

    if (button === 0 && this.keys.Control) {

      this.isDragging = true

      this.mousePos = {
        x: event.clientX,
        y: event.clientY
      }

      return true
    }

    var hitPoint = this.getHitPoint(event)

    if (hitPoint) {

      this._hitPoint = hitPoint
    }

    return false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  handleButtonUp (event, button) {

    if (this.rotateControl) {

      this.rotateControl.onPointerUp(event)
    }

    if (button === 0) {

      this.isDragging = false
    }

    return false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  handleMouseMove (event) {

    if (this.rotateControl) {

      this.rotateControl.onPointerHover(event)
    }

    if (this.isDragging) {

      if (this.selection) {

        var offset = {
          x: this.mousePos.x - event.clientX,
          y: event.clientY - this.mousePos.y
        }

        this.mousePos = {
          x: event.clientX,
          y: event.clientY
        }

        var angle = Math.sqrt(
          offset.x * offset.x +
          offset.y * offset.y)

        var sidewaysDirection = new THREE.Vector3()
        var moveDirection = new THREE.Vector3()
        var eyeDirection = new THREE.Vector3()
        var upDirection = new THREE.Vector3()
        var camera = this.viewer.getCamera()
        var axis = new THREE.Vector3()
        var eye = new THREE.Vector3()

        eye.copy(camera.position).sub(camera.target)

        eyeDirection.copy(eye).normalize()

        upDirection.copy(camera.up).normalize()

        sidewaysDirection.crossVectors(
          upDirection, eyeDirection).normalize()

        upDirection.setLength(offset.y)

        sidewaysDirection.setLength(offset.x)

        moveDirection.copy(
          upDirection.add(
            sidewaysDirection))

        axis.crossVectors(moveDirection, eye).normalize()

        this.rotateFragments(
          this.selection.model,
          this.selection.fragIdsArray,
          axis, angle * Math.PI / 180,
          this.center)

        this.viewer.impl.sceneUpdated(true)
      }

      return true
    }

    return false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  handleKeyDown (event, keyCode) {

    this.keys[event.key] = true

    if (keyCode === 27) { //ESC

      this.viewer.clearSelection()
    }

    return false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  handleKeyUp (event, keyCode) {

    this.keys[event.key] = false

    return false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  rotateFragments (model, fragIdsArray, axis, angle, center) {

    var quaternion = new THREE.Quaternion()

    quaternion.setFromAxisAngle(axis, angle)

    fragIdsArray.forEach((fragId, idx) => {

      var fragProxy = this.viewer.impl.getFragmentProxy(
        model, fragId)

      fragProxy.getAnimTransform()

      var position = new THREE.Vector3(
        fragProxy.position.x - center.x,
        fragProxy.position.y - center.y,
        fragProxy.position.z - center.z)

      position.applyQuaternion(quaternion)

      position.add(center)

      fragProxy.position = position

      fragProxy.quaternion.multiplyQuaternions(
        quaternion, fragProxy.quaternion)

      if (idx === 0) {

        if(this._hitPoint) {

          this._hitPoint.sub(center)

          this._hitPoint.applyQuaternion(quaternion)

          this._hitPoint.add(center)
        }

        var euler = new THREE.Euler()

        euler.setFromQuaternion(
          fragProxy.quaternion, 0)

        this.emit('transform.rotate', {
          rotation: euler,
          model
        })
      }

      fragProxy.updateAnimTransform()
    })
  }

  ///////////////////////////////////////////////////////////////////////////
  // returns bounding box as it appears in the viewer
  // (transformations could be applied)
  //
  ///////////////////////////////////////////////////////////////////////////
  geWorldBoundingBox (fragIds, fragList) {

    var fragbBox = new THREE.Box3()
    var nodebBox = new THREE.Box3()

    fragIds.forEach((fragId) => {

      fragList.getWorldBounds(fragId, fragbBox)
      nodebBox.union(fragbBox)
    })

    return nodebBox
  }
}

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
class RotateControl extends EventsEmitter {

  constructor (viewer, center, size) {

    super()

    this.engaged = false

    this.overlayScene = 'rotateControlScene'
    this.domElement = viewer.impl.canvas
    this.camera = viewer.impl.camera
    this.viewer = viewer
    this.center = center
    this.size = size
    this.gizmos = []

    this.viewer.impl.createOverlayScene(
      this.overlayScene)

    this.createAxis(
      center, new THREE.Vector3(1, 0, 0),
      size * 0.85, 0xFF0000)

    this.createAxis(
      center, new THREE.Vector3(0, 1, 0),
      size * 0.85, 0x00FF00)

    this.createAxis(
      center, new THREE.Vector3(0, 0, 1),
      size * 0.85, 0x0000FF)

    // World UP = Y

    if (this.camera.worldup.y) {

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(0, Math.PI / 2, 0),
        size * 0.0045,
        size * 0.4, 0xFF0000,
        Math.PI,
        new THREE.Vector3(1, 0, 0)))

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(Math.PI / 2, 0, 0),
        size * 0.0045,
        size * 0.4, 0x00FF00,
        2 * Math.PI,
        new THREE.Vector3(0, 1, 0)))

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(0, 0, 0),
        size * 0.0045,
        size * 0.4, 0x0000FF,
        Math.PI,
        new THREE.Vector3(0, 0, 1)))

    } else {

      // World UP = Z

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(Math.PI / 2, Math.PI / 2, 0),
        size * 0.0045,
        size * 0.4, 0xFF0000,
        Math.PI,
        new THREE.Vector3(1, 0, 0)))

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(Math.PI / 2, 0, 0),
        size * 0.0045,
        size * 0.4, 0x00FF00,
        Math.PI,
        new THREE.Vector3(0, 1, 0)))

      this.gizmos.push(this.createGizmo(
        center,
        new THREE.Euler(0, 0, 0),
        size * 0.0045,
        size * 0.4, 0x0000FF,
        2 * Math.PI,
        new THREE.Vector3(0, 0, 1)))
    }

    this.picker = this.createSphere(
      size * 0.02)

    var material = new THREE.LineBasicMaterial({
      color: 0xFFFF00,
      linewidth: 1,
      depthTest: false,
      depthWrite: false,
      transparent: true
    })

    this.angleLine =
      this.createLine(
        this.center,
        this.center,
        material)

    viewer.impl.sceneUpdated(true)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createLine (start, end, material) {

    var geometry = new THREE.Geometry()

    geometry.vertices.push(new THREE.Vector3(
      start.x, start.y, start.z))

    geometry.vertices.push(new THREE.Vector3(
      end.x, end.y, end.z))

    var line = new THREE.Line(geometry, material)

    this.viewer.impl.addOverlay(
      this.overlayScene, line)

    return line
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createCone (start, dir, length, material) {

    dir.normalize()

    var end = {
      x: start.x + dir.x * length,
      y: start.y + dir.y * length,
      z: start.z + dir.z * length
    }

    var orientation = new THREE.Matrix4()

    orientation.lookAt(
      start,
      end,
      new THREE.Object3D().up)

    var matrix = new THREE.Matrix4()

    matrix.set(
      1, 0, 0, 0,
      0, 0, 1, 0,
      0, -1, 0, 0,
      0, 0, 0, 1)

    orientation.multiply(matrix)

    var geometry = new THREE.CylinderGeometry(
      0, length * 0.2, length, 128, 1)

    var cone = new THREE.Mesh(geometry, material)

    cone.applyMatrix(orientation)

    cone.position.x = start.x + dir.x * length / 2
    cone.position.y = start.y + dir.y * length / 2
    cone.position.z = start.z + dir.z * length / 2

    this.viewer.impl.addOverlay(
      this.overlayScene, cone)

    return cone
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createAxis (start, dir, size, color) {

    var end = {
      x: start.x + dir.x * size,
      y: start.y + dir.y * size,
      z: start.z + dir.z * size
    }

    var material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      depthTest: false,
      depthWrite: false,
      transparent: true
    })

    this.createLine(
      start, end, material)

    this.createCone(
      end, dir, size * 0.1, material)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createGizmo (center, euler, size, radius, color, range, axis) {

    var material = new GizmoMaterial({
      color: color
    })

    var subMaterial = new GizmoMaterial({
      color: color
    })

    var torusGizmo = new THREE.Mesh(
      new THREE.TorusGeometry(
        radius, size, 64, 64, range),
      material)

    var subTorus = new THREE.Mesh(
      new THREE.TorusGeometry(
        radius, size, 64, 64, 2 * Math.PI),
      subMaterial)

    subTorus.material.highlight(true)

    var transform = new THREE.Matrix4()

    var q = new THREE.Quaternion()

    q.setFromEuler(euler)

    var s = new THREE.Vector3(1, 1, 1)

    transform.compose(center, q, s)

    torusGizmo.applyMatrix(transform)

    subTorus.applyMatrix(transform)

    var plane = this.createBox(
      this.size * 100,
      this.size * 100,
      0.01)

    plane.applyMatrix(transform)

    subTorus.visible = false

    this.viewer.impl.addOverlay(
      this.overlayScene, torusGizmo)

    this.viewer.impl.addOverlay(
      this.overlayScene, subTorus)

    torusGizmo.subGizmo = subTorus
    torusGizmo.plane = plane
    torusGizmo.axis = axis

    return torusGizmo
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createBox (w, h, d) {

    var material = new GizmoMaterial({
      color: 0x000000
    })

    var geometry = new THREE.BoxGeometry(w, h, d)

    var box = new THREE.Mesh(
      geometry, material)

    box.visible = false

    this.viewer.impl.addOverlay(
      this.overlayScene, box)

    return box
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  createSphere (radius) {

    var material = new GizmoMaterial({
      color: 0xFFFF00
    })

    var geometry = new THREE.SphereGeometry(
      radius, 32, 32)

    var sphere = new THREE.Mesh(
      geometry, material)

    sphere.visible = false

    this.viewer.impl.addOverlay(
      this.overlayScene, sphere)

    return sphere
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  pointerToRaycaster (pointer) {

    var pointerVector = new THREE.Vector3()
    var pointerDir = new THREE.Vector3()
    var ray = new THREE.Raycaster()

    var rect = this.domElement.getBoundingClientRect()

    var x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1
    var y = -((pointer.clientY - rect.top) / rect.height) * 2 + 1

    if (this.camera.isPerspective) {

      pointerVector.set(x, y, 0.5)

      pointerVector.unproject(this.camera)

      ray.set(this.camera.position,
        pointerVector.sub(
          this.camera.position).normalize())

    } else {

      pointerVector.set(x, y, -1)

      pointerVector.unproject(this.camera)

      pointerDir.set(0, 0, -1)

      ray.set(pointerVector,
        pointerDir.transformDirection(
          this.camera.matrixWorld))
    }

    return ray
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  onPointerDown (event) {

    var pointer = event.pointers ? event.pointers[ 0 ] : event

    if (pointer.button === 0) {

      var ray = this.pointerToRaycaster(pointer)

      var intersectResults = ray.intersectObjects(
        this.gizmos, true)

      if (intersectResults.length) {

        this.gizmos.forEach((gizmo) => {

          gizmo.visible = false
        })

        this.selectedGizmo = intersectResults[0].object

        this.selectedGizmo.subGizmo.visible = true

        this.picker.position.copy(
          intersectResults[0].point)

        this.angleLine.geometry.vertices[1].copy(
          intersectResults[0].point)

        this.lastDir = intersectResults[0].point.sub(
          this.center).normalize()

        this.angleLine.geometry.verticesNeedUpdate = true

        this.angleLine.visible = true

        this.picker.visible = true

      } else {

        this.picker.visible = false
      }

      this.engaged = this.picker.visible

      this.viewer.impl.sceneUpdated(true)
    }

    return this.picker.visible
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  onPointerHover (event) {

    var pointer = event.pointers ? event.pointers[ 0 ] : event

    if (this.engaged) {

      var ray = this.pointerToRaycaster(pointer)

      var intersectResults = ray.intersectObjects(
        [this.selectedGizmo.plane], true)

      if (intersectResults.length) {

        var intersectPoint = intersectResults[0].point

        var dir = intersectPoint.sub(
          this.center).normalize()

        var cross = new THREE.Vector3()

        cross.crossVectors(this.lastDir, dir)

        var sign = Math.sign(
          cross.dot(this.selectedGizmo.axis))

        this.emit('transform.rotate', {
          angle: sign * dir.angleTo(this.lastDir),
          axis: this.selectedGizmo.axis
        })

        this.lastDir = dir

        var pickerPoint = new THREE.Vector3(
          this.center.x + dir.x * this.size * 0.8,
          this.center.y + dir.y * this.size * 0.8,
          this.center.z + dir.z * this.size * 0.8)

        this.picker.position.copy(
          pickerPoint)

        this.angleLine.geometry.vertices[1].copy(
          pickerPoint)
      }

      this.angleLine.visible = true

      this.angleLine.geometry.verticesNeedUpdate = true

    } else {

      this.angleLine.visible = false

      var ray = this.pointerToRaycaster(pointer)

      var intersectResults = ray.intersectObjects(
        this.gizmos, true)

      if (intersectResults.length) {

        this.picker.position.set(
          intersectResults[ 0 ].point.x,
          intersectResults[ 0 ].point.y,
          intersectResults[ 0 ].point.z)

        this.picker.visible = true

      } else {

        this.picker.visible = false
      }
    }

    this.viewer.impl.sceneUpdated(true)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  onPointerUp (event) {

    this.angleLine.visible = false

    this.picker.visible = false

    this.gizmos.forEach((gizmo) => {

      gizmo.visible = true
      gizmo.subGizmo.visible = false
    })

    this.viewer.impl.sceneUpdated(true)

    setTimeout(() => {
      this.engaged = false
    }, 100)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  normalize(screenPoint) {

    var viewport = this.viewer.navigation.getScreenViewport()

    var n = {
      x: (screenPoint.x - viewport.left) / viewport.width,
      y: (screenPoint.y - viewport.top) / viewport.height
    }

    return n
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  projectOntoPlane (worldPoint, normal) {

    var dist = normal.dot(worldPoint)

    return new THREE.Vector3(
      worldPoint.x - dist * normal.x,
      worldPoint.y - dist * normal.y,
      worldPoint.z - dist * normal.z)
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  remove () {

    this.viewer.impl.removeOverlayScene(
      this.overlayScene)
  }
}

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
class GizmoMaterial extends THREE.MeshBasicMaterial {

  constructor (parameters) {

    super()

    this.setValues(parameters)

    this.colorInit = this.color.clone()
    this.opacityInit = this.opacity
    this.side = THREE.FrontSide
    this.depthWrite = false
    this.transparent = true
    this.depthTest = false
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  //
  ///////////////////////////////////////////////////////////////////////////
  highlight (highlighted) {

    if (highlighted) {

      this.color.setRGB(1, 230 / 255, 3 / 255)
      this.opacity = 1

    } else {

      this.color.copy(this.colorInit)
      this.opacity = this.opacityInit
    }
  }
}
