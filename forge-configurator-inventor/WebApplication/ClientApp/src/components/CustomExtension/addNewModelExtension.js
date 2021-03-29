import './addNewModelExtension.css'
import repo from '../../Repository';
import transform from './transformtool'




export default function RegisterAddNewModelTool() {

    var Autodesk = window.Autodesk;
    var AutodeskNamespace = window.AutodeskNamespace;
    var THREE = window.THREE;


    AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

    Autodesk.ADN.Viewing.Extension.AddNewModelTool = function (viewer) {


        var viewer = window.viewer;

        var _selectedModel = null;

        document.addEventListener('keydown', function (event) {
            if (event.ctrlKey && event.key === 'z') {
                let models = viewer.impl.modelQueue().getModels();
                const model = models.lastItem //!<< The model you want to unload
                viewer.impl.unloadModel(model);
                //alert('Undo!');
            }

            if (event.key ==="Delete") {
                viewer.impl.unloadModel(_selectedModel);
            }
        });

        viewer.addEventListener(
            Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
            setSelectedModel);

        //set selected model
        function setSelectedModel() {
            try {
                
            _selectedModel = viewer.getAggregateSelection()[0].model;
                
            } catch (error) {
                _selectedModel = viewer.model;
            }
        }

        function AddNewModelTool() {

            var _hitPoint = null;

            var _modifiedFragIdMap = {};

            var _selectedFragProxyMap = {};

            let loadedModel = null;
            let loadedModelUrn = null;
            let fragProxy = null;
            let matrix = new THREE.Matrix4();


            var ModelArray = ["door", "vent"];

            ModelArray.forEach(function (model) {
                document.getElementById(model).addEventListener("click", function () {
                    onClick();
                });
            });

            function onClick(event) {
                //event.dataTransfer.effectAllowed = 'copy';

                let img = event.target;
                loadedModelUrn = img.getAttribute("urn");
            }

            ///////////////////////////////////////////////////////////////////////////
            // item selected callback
            ///////////////////////////////////////////////////////////////////////////
            function onItemSelected(event) {

                //set selected model
                _selectedModel = viewer.getAggregateSelection()[0].model;

                _selectedFragProxyMap = {};

                //component unselected
                if (!event.selections[0].fragIdsArray.length) {

                    _hitPoint = null;
                    return;
                }

                if (_hitPoint) {

                    event.selections[0].fragIdsArray.forEach(function (fragId) {
                        console.log("Selected Model:" + _selectedModel);
                        console.log("fragId:" + fragId);

                        fragProxy = viewer.impl.getFragmentProxy(
                            _selectedModel,
                            fragId);

                        fragProxy.getAnimTransform();
                        console.log("fragProxy:" + fragProxy);


                        var offset = {

                            x: _hitPoint.x - fragProxy.position.x,
                            y: _hitPoint.y - fragProxy.position.y,
                            z: _hitPoint.z - fragProxy.position.z
                        };

                        fragProxy.offset = offset;
                        console.log("fragProxyOffset:" + fragProxy.offset);
                        fragProxy.getOriginalWorldMatrix(matrix);
                        console.log(matrix)

                        _selectedFragProxyMap[fragId] = fragProxy;

                        _modifiedFragIdMap[fragId] = {};
                    });


                    loadedModelUrn = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YXV0aGQtdmdvOXRudzI2a3dpaW5lZWVuc2t0YWUxZnVxejI3dnctNHY2LWM1NzE1NDQ2MWUxMDdjY2Q5OTcyZmM0ZWEwM2UzNTdjMzExOGQ1ZjUvMzAwJTIweCUyMDMwMCUyMFByZXNzZWQlMjBBbHVtaW5pdW0lMjBWZW50LmlwdA";
                    // Check if it's a urn pointing at a file from OSS
                    if (loadedModelUrn.startsWith("urn:")) {
                        fetch("/api/viewables/token")
                            .then(response => response.text())
                            .then(token => {
                                Autodesk.Viewing.endpoint.setEndpointAndApi("https://developer.api.autodesk.com", 'modelDerivativeV2');
                                Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"] = "Bearer " + token;
                                loadDocument(loadedModelUrn, fragProxy);
                            })
                    } else {
                        Autodesk.Viewing.endpoint.setEndpointAndApi("", 'modelDerivativeV2');
                        delete Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"];

                        loadDocument(loadedModelUrn, fragProxy);
                    }


                    _hitPoint = null;


                }
                else {

                    console.log("error");
                }
            }

            //loadDocument
            function loadDocument(documentId, fragProxy) {
                Autodesk.Viewing.Document.load(documentId, (doc) => {
                    let items = doc.getRoot().search(
                        {
                            type: "geometry",
                            role: "3d",
                        },
                        true
                    );
                    if (items.length === 0) {
                        console.error("Document contains no viewables.");
                        return;
                    }

                    let loadMatrixTemp = new THREE.Matrix4();

                    /*for (let i = 0; i < matrix.length; i++) {
                        if (Math.abs(matrix[i]) < 0.00001) {
                            loadMatrixTemp.set(loadMatrixTemp[i] = 0);
                        }
                        if (matrix[i] != 0) {
                            if (matrix[i]>0) {
                                loadMatrixTemp.set(loadMatrixTemp[i] = 1);
                            }
                            else{
                                loadMatrixTemp.set(loadMatrixTemp[i] = -1);
                            }
                        }                        
                    }*/

                    let matrixArr = [];
                    matrix.elements.forEach(element => {
                        if (Math.abs(element) < 0.00001) {
                            element = 0;
                            matrixArr.push(element);
                        }
                        if (element != 0) {
                            if (element > 0) {
                                element = 1;
                                matrixArr.push(element);
                            }
                            else {
                                element = -1;
                                matrixArr.push(element);
                            }
                        }
                        //console.log(element);
                        loadMatrixTemp.fromArray(matrixArr);
                    });

                    var a = new THREE.Vector3(fragProxy.offset.x, fragProxy.offset.y, fragProxy.offset.z);
                    loadMatrixTemp.setPosition(a);
                    console.log("Temp");
                    console.log(loadMatrixTemp);

                    viewer
                        .loadDocumentNode(doc, items[0], {
                            keepCurrentModels: true,
                            //placementTransform: loadMatrixTemp,
                            //placementWithOffset:loadMatrixTemp
                            //refPointTransform:loadMatrixTemp
                        })
                        .then(function (model) {
                            console.log("Loaded Model");
                            loadedModel = model;
                            let tr = loadedModel.getPlacementTransform();

                            tr.elements[0] = matrixArr[0];
                            tr.elements[1] = matrixArr[1];
                            tr.elements[2] = matrixArr[2];
                            tr.elements[3] = matrixArr[3];
                            tr.elements[4] = matrixArr[4];
                            tr.elements[5] = matrixArr[5];
                            tr.elements[6] = matrixArr[6];
                            tr.elements[7] = matrixArr[7];
                            tr.elements[8] = matrixArr[8];
                            tr.elements[9] = matrixArr[9];
                            tr.elements[10] = matrixArr[10];
                            tr.elements[11] = matrixArr[11];

                            //position
                            tr.elements[12] = fragProxy.offset.x;
                            tr.elements[13] = fragProxy.offset.y;
                            tr.elements[14] = fragProxy.offset.z;
                            tr.elements[15] = 1;
                            //console.log(fragProxy);

                            console.log(tr);
                            //loadedModel.setModelTransform(tr);
                            loadedModel.setPlacementTransform(tr);
                            viewer.impl.invalidate(true, true, true);
                        });
                });
            }

            ///////////////////////////////////////////////////////////////////////////
            // normalize screen coordinates
            ///////////////////////////////////////////////////////////////////////////
            function normalize(screenPoint) {

                var viewport = viewer.navigation.getScreenViewport();

                var n = {
                    x: (screenPoint.x - viewport.left) / viewport.width,
                    y: (screenPoint.y - viewport.top) / viewport.height
                };

                return n;
            }

            ///////////////////////////////////////////////////////////////////////////
            // get 3d hit point on mesh
            ///////////////////////////////////////////////////////////////////////////
            function getHitPoint(event) {

                var screenPoint = {
                    x: event.clientX,
                    y: event.clientY
                };

                var n = normalize(screenPoint);

                var hitPoint = viewer.utilities.getHitPoint(n.x, n.y);

                return hitPoint;
            }

            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.getNames = function () {

                return ['addNewModelTool'];
            };

            this.getName = function () {

                return 'addNewModelTool';
            };

            ///////////////////////////////////////////////////////////////////////////
            // activates tool
            //
            ///////////////////////////////////////////////////////////////////////////
            this.activate = function () {

                viewer.select([]);

                viewer.addEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);

                console.log("Add New Model Extension Activate");
                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "inline-flex";

            };

            ///////////////////////////////////////////////////////////////////////////
            // deactivate tool
            //
            ///////////////////////////////////////////////////////////////////////////
            this.deactivate = function () {


                viewer.impl.removeOverlayScene(
                    'addNewModelTool');


                viewer.removeEventListener(
                    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
                    onItemSelected);


                console.log("Add New Model Extension Deactivate");

                var modelLoadContainer = document.getElementById("modelLoadContainer");
                modelLoadContainer.style.display = "none";

            };

            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.update = function (t) {

                return false;
            };

            this.handleSingleClick = function (event, button) {


                return false;
            };

            this.handleDoubleClick = function (event, button) {

                return false;
            };


            this.handleSingleTap = function (event) {

                return false;
            };


            this.handleDoubleTap = function (event) {

                return false;
            };

            this.handleKeyDown = function (event, keyCode) {

                return false;
            };

            this.handleKeyUp = function (event, keyCode) {

                return false;
            };

            this.handleWheelInput = function (delta) {

                return false;
            };

            ///////////////////////////////////////////////////////////////////////////
            //
            //
            ///////////////////////////////////////////////////////////////////////////
            this.handleButtonDown = function (event, button) {

                _hitPoint = getHitPoint(event);
                // console.log("Hitpoint--------" + _hitPoint);
                // console.log("x" + _hitPoint.x);
                // console.log("y" + _hitPoint.y);
                // console.log("z" + _hitPoint.z);

            };


        }



        Autodesk.Viewing.Extension.call(this, viewer);

        var _self = this;

        _self.tool = null;

        _self.toolactivated = false;

        ///////////////////////////////////////////////////////
        // extension load callback
        //
        ///////////////////////////////////////////////////////
        _self.load = function () {

            console.log('Autodesk.ADN.Viewing.Extension.AddNewModelTool aaa loaded');

            return true;
        };

        _self.onToolbarCreated = function () {
            // Create a new toolbar group if it doesn't exist
            this._group = this.viewer.toolbar.getControl('CustomExtensionsToolbar');
            if (!this._group) {
                this._group = new Autodesk.Viewing.UI.ControlGroup('CustomExtensionsToolbar');
                this.viewer.toolbar.addControl(this._group);
            }

            // Add a new button to the toolbar group
            this._button = new Autodesk.Viewing.UI.Button('AddNewModelToolExtensionButton');
            this._button.onClick = (ev) => {
                // Execute an action here
                if (!_self.toolactivated) {
                    _self.initialize();
                    _self.toolactivated = true;
                } else {
                    viewer.toolController.deactivateTool(_self.tool.getName());
                    _self.toolactivated = false;
                }
            };
            this._button.setToolTip('Add New Model Extension');
            this._button.addClass('addNewModelIcon');
            this._group.addControl(this._button);
        };

        _self.initialize = function () {
            _self.tool = new AddNewModelTool();

            viewer.toolController.registerTool(_self.tool);

            //Set first model
            if (_selectedModel == null) {
                _selectedModel = this.viewer.model;
            }

            if (_selectedModel.getInstanceTree()) {
                _self.customize();
            } else {
                this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, _self.customize());
            }
        };

        _self.customize = function () {
            viewer.toolController.activateTool(_self.tool.getName());
        };

        ///////////////////////////////////////////////////////
        // extension unload callback
        //
        ///////////////////////////////////////////////////////
        _self.unload = function () {

            if (_self.tool) viewer.toolController.deactivateTool(_self.tool.getName());
            // Clean our UI elements if we added any
            if (this._group) {
                this._group.removeControl(this._button);
                if (this._group.getNumberOfControls() === 0) {
                    this.viewer.toolbar.removeControl(this._group);
                }
            }
            console.log('Autodesk.ADN.Viewing.Extension.AddNewModelTool unloaded');

            return true;
        };

        ///////////////////////////////////////////////////////
        // new random guid
        //
        ///////////////////////////////////////////////////////
        function guid() {

            var d = new Date().getTime();

            var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
                /[xy]/g,
                function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
                });

            return guid;
        };


    };

    Autodesk.ADN.Viewing.Extension.AddNewModelTool.prototype =
        Object.create(Autodesk.Viewing.Extension.prototype);

    Autodesk.ADN.Viewing.Extension.AddNewModelTool.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.AddNewModelTool;

    Autodesk.Viewing.theExtensionManager.registerExtension(
        'AddNewModelToolExtension',
        Autodesk.ADN.Viewing.Extension.AddNewModelTool);
}

