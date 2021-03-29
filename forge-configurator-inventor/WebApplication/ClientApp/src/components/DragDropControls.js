let viewer = null;
let mainModel = null;
let draggedModel = null;
let draggedModelUrn = null;
let Autodesk = null;
let _selectedModel = null;
let models = null;

export function onDragStart(event) {
    event.dataTransfer.effectAllowed = 'copy';

    let img = event.target;
    draggedModelUrn = img.getAttribute("urn");

    Autodesk = window.Autodesk;
    viewer = window.viewer;


    models = viewer.impl.modelQueue().getModels();
    mainModel = viewer.model;
    //viewer.addEventListener(
     //   Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
      //  setSelectedModel);

    //After load drag-drop
    document.onkeydown = event => {
        models = viewer.impl.modelQueue().getModels();
        let lastModel = models.lastItem
        if (_selectedModel != null) {
            lastModel = _selectedModel;
            console.log(lastModel);
        }
        if (!event.shiftKey)
            return;

        if (event.code === "ArrowRight") {
            let tr = lastModel.getPlacementTransform();
            tr.elements[12] += 1;
            lastModel.setPlacementTransform(tr);
        }

        if (event.code === "ArrowLeft") {
            let tr = lastModel.getPlacementTransform();
            tr.elements[12] -= 1;
            lastModel.setPlacementTransform(tr);
        }
    };

    document.onmousemove = event => {

        models = viewer.impl.modelQueue().getModels();
        let lastModel = models.lastItem
        if (_selectedModel != null) {
            lastModel = _selectedModel;
            console.log(lastModel);
        }
        if (!event.ctrlKey)
            return;

        var boxRectangle = event.target.getBoundingClientRect();

        let x = event.clientX - boxRectangle.left;
        let y = event.clientY - boxRectangle.top;

        let res = viewer.impl.hitTest(x, y, true, null, [mainModel.getModelId()]);
        let pt = null;

        if (res) {
            pt = res.intersectPoint;
        } else {
            pt = viewer.impl.intersectGround(x, y);
        }

        let tr = lastModel.getPlacementTransform();
        tr.elements[12] = pt.x;
        tr.elements[13] = pt.y;
        tr.elements[14] = pt.z;
        lastModel.setPlacementTransform(tr);
        viewer.impl.invalidate(true, true, true);
    }

}


//set selected model
function setSelectedModel() {
    _selectedModel = viewer.getAggregateSelection()[0].model;
    console.log(_selectedModel.id);
}

// Load model
const ModelState = {
    unloaded: 0,
    loading: 1,
    loaded: 2,
};
let modelState = ModelState.unloaded;

function loadDocument(documentId) {
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

        viewer
            .loadDocumentNode(doc, items[0], {
                keepCurrentModels: true
            })
            .then(function (model) {
                draggedModel = model;
                modelState = ModelState.loaded;
            });
    });
}

export function onDragOver(event) {
    event.preventDefault();

    switch (modelState) {
        case ModelState.unloaded: {
            modelState = ModelState.loading;

            // Check if it's a urn pointing at a file from OSS
            if (draggedModelUrn.startsWith("urn:")) {
                fetch("/api/viewables/token")
                    .then(response => response.text())
                    .then(token => {
                        Autodesk.Viewing.endpoint.setEndpointAndApi("https://developer.api.autodesk.com", 'modelDerivativeV2');
                        Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"] = "Bearer " + token;
                        loadDocument(draggedModelUrn);
                    })
            } else {
                Autodesk.Viewing.endpoint.setEndpointAndApi("", 'modelDerivativeV2');
                delete Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS["Authorization"];

                loadDocument(draggedModelUrn);
            }

            break;
        }

        case ModelState.loaded: {
            var boxRectangle = event.target.getBoundingClientRect();

            let x = event.clientX - boxRectangle.left;
            let y = event.clientY - boxRectangle.top;

            let res = viewer.impl.hitTest(
                x,
                y,
                true,
                null,
                [mainModel.getModelId()]
            );
            let pt = null;

            if (res) {
                pt = res.intersectPoint;
            } else {
                pt = viewer.impl.intersectGround(x, y);
            }

            let tr = draggedModel.getPlacementTransform();
            tr.elements[12] = pt.x;
            tr.elements[13] = pt.y;
            tr.elements[14] = pt.z;
            draggedModel.setPlacementTransform(tr);
            viewer.impl.invalidate(true, true, true);


            break;
        }
    }
}

export function onDrop(event) {
    event.preventDefault();
    modelState = ModelState.unloaded;
}



