import React, { Component } from 'react'
import './modelLoadContainer.css';
import * as dragDrop from './DragDropControls.js';

import * as addModel from './CustomExtension/addNewModelExtension';

export default class ModelLoadContainer extends Component {

    onSelectPartChange() {
        var partName = document.getElementById("partSlct").value;
        var models = document.getElementsByClassName("model");
        //show select model
        models.forEach(model => {
            if (partName == model.id) {
                console.log(partName);
                model.style.display = "inline";
            }
        });
        //hide other models
        models.forEach(model => {
            if (partName == model.id) {
                model.style.display = "inline";
            }
            else {
                model.style.display = "none";
            }
        });

        //set model urn
        var modelUrn = document.getElementById(partName).getAttribute("urn");
        document.getElementById("selectedModelUrn").innerHTML = modelUrn;
        //console.log(partName + ":" + modelUrn)

    }


    setUrn(modelId) {
        var x = document.getElementById(modelId).getAttribute("urn");
        document.getElementById("selectedModelUrn").innerHTML = x;
        alert(modelId + "selected");
        var loadedModelNames = [];
        window.loadedModelNames = loadedModelNames;

    }

    render() {
        return (
            <div id="modelLoadContainer" className="modelLoadContainer">
                <h4 id="transformHeader">Edit/Load Model</h4>


                <label id="modelLoadSelection" className="boxes" >Select Model

                <select id="partSlct" onChange={this.onSelectPartChange}>
                        <option >-</option>
                        <option value="door">Door</option>
                        <option value="vent">Vent</option>
                    </select>

                </label>


                <img id="door" onClick={() => this.setUrn('door')} onDragStart={dragDrop.onDragStart} class="model" src="/LoadModel/door.png" urn="urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YXV0aGQtdmdvOXRudzI2a3dpaW5lZWVuc2t0YWUxZnVxejI3dnctNHY2LWM1NzE1NDQ2MWUxMDdjY2Q5OTcyZmM0ZWEwM2UzNTdjMzExOGQ1ZjUvTmV3JTIwU2luZ2xlJTIwRG9vciUyMChMZWZ0KSUyMDgwMCUyMDIwMDAuaWFtLnppcA" />
                <img id="vent" onClick={() => this.setUrn('vent')} onDragStart={dragDrop.onDragStart} class="model" src="/LoadModel/vent.png" urn="urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YXV0aGQtdmdvOXRudzI2a3dpaW5lZWVuc2t0YWUxZnVxejI3dnctNHY2LWM1NzE1NDQ2MWUxMDdjY2Q5OTcyZmM0ZWEwM2UzNTdjMzExOGQ1ZjUvMzAwJTIweCUyMDMwMCUyMFByZXNzZWQlMjBBbHVtaW5pdW0lMjBWZW50LmlwdA" />


                <div class="transformInputs">
                    <label className="boxes">Top
                        <input id="TopRef" type="text" />
                    </label>

                    <label className="boxes" >Bottom <input id="BottomRef" type="text" /></label>

                    <label className="boxes" >Left <input id="LeftRef" type="text" /></label>

                    <label className="boxes"  >Right <input id="RightRef" type="text" /></label>

                </div>

                <button id="modelEditSave" className="css-ulcpt3">Save</button>
                <p id="selectedModelUrn">ModelUrn</p>
            </div>

        )
    }
}
