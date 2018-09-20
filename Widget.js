/*

used https://developers.arcgis.com/web-appbuilder/sample-code/create-a-listview-widget.htm as an example
*/

define([
    'dojo/_base/declare',
    'jimu/BaseWidget',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/LayerInfos/LayerInfos',
    'dijit/form/Select',
    'dijit/form/Button',
    'esri/tasks/query',
    'dgrid/Selection',
    'dojo/store/Memory',
    'esri/geometry/Polygon',
  ],
  function (declare, BaseWidget, lang, array, _WidgetsInTemplateMixin, LayerInfos, Query, Selection, Memory, Polygon) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      // Custom widget code goes here

      baseClass: 'select-by-bounds',
      // this property is set by the framework when widget is loaded.
      // name: 'SelectByBounds',
      // add additional properties here

      //methods to communication with app container:


      postCreate: function () {
        this.inherited(arguments);
        console.log('SelectByBounds::postCreate');
      },

      startup: function () {
        this.inherited(arguments);
        console.log('SelectByBounds::startup');

        // Get all feature layers from the map
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function (layerInfosObj) {
            var infos = layerInfosObj.getLayerInfoArray();
            var options = [];
            array.forEach(infos, function (info) {
              if (info.originOperLayer.layerType === 'ArcGISFeatureLayer') {
                options.push({
                  label: info.title,
                  value: info.id
                });
              }
            });
            //data-dojo-attach-point="layerTargetSelect"
            this.layerTargetSelect.set('options', options);
            //data-dojo-attach-point="layerBoundSelect" 
            //to-do filter only for polygon layers for bounds
            this.layerBoundSelect.set('options', options);

            this.layerBoundSelect.on('change', lang.hitch(this, function (value) {
              var selectedLayer = layerInfosObj.getLayerInfoById(value);
              if (selectedLayer) {
                var fieldOptions = array.map(selectedLayer.layerObject.fields, function (field) {
                  return {
                    label: field.alias || field.name,
                    value: field.name
                  }
                });
                //data-dojo-attach-point="fieldBoundSelect"
                this.fieldBoundSelect.set('options', fieldOptions);

                //to-do: clear valueBoundSelect

                this.fieldBoundSelect.on('change', lang.hitch(this, function (field) {

                  //get field values and populate
                  var query = new Query();
                  query.returnGeometry = false;
                  query.outFields = [field];
                  query.where = '1=1';
                  query.returnDistinctValues = true;

                  var layer = this.map.getLayer(selectedLayer.id);

                  layer.queryFeatures(query, lang.hitch(this, function (featureSet) {
                    var valueOptions = array.map(featureSet.features, function (feature) {
                      var value = feature.attributes[field];
                      return {
                        label: String(value),
                        value: value
                      }
                    })
                    this.valueBoundSelect.set('options', valueOptions);
                  }));
                }))
              }
            }))
          }));

        this.runSelectButton.on('click', lang.hitch(this, function () {
          //to-do add check for fields, if not throw err
          var layerTarget = this.map.getLayer(this.layerTargetSelect.get('value'));
          var boundLayer = this.map.getLayer(this.layerBoundSelect.get('value'));
          var boundField = this.fieldBoundSelect.get('value');
          var boundValue = this.valueBoundSelect.get('value');

          var query = new Query();
          query.returnGeometry = true;
          query.outFields = [];
          //check type of boundValue then make a query
          var value = typeof boundValue === 'string' ? "'" + boundValue + "'" : boundValue
          console.log(value)
          query.where = boundField + '=' + value;

          //get bound geom for target query
          boundLayer.queryFeatures(query, lang.hitch(this, function (boundFeatureSet) {
            //to-do combine all geoms , for now use the first one
            console.log(boundFeatureSet.features.length)
            var targetQuery = new Query();
            targetQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            targetQuery.geometry = boundFeatureSet.features[0].geometry;
            
            //https://community.esri.com/thread/188558-highlight-features-on-a-featurelayer-after-query
            targetQuery.outSpatialReference = this.map.spatialReference;

            // targetQuery.where = '1=1';
            // targetQuery.returnGeometry = false;
            // targetQuery.outFields = ['*'];
            // layerTarget.queryFeatures(targetQuery, lang.hitch(this, function (targetFeatureSet) {
            //   console.log(targetFeatureSet);
            // }));
            layerTarget.selectFeatures(targetQuery, esri.layers.FeatureLayer.SELECTION_NEW, lang.hitch(this, function (result) {
              
            }))

          }))

        }))
      },

      // onOpen: function(){
      //   console.log('SelectByBounds::onOpen');
      // },

      // onClose: function(){
      //   console.log('SelectByBounds::onClose');
      // },

      // onMinimize: function(){
      //   console.log('SelectByBounds::onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('SelectByBounds::onMaximize');
      // },

      // onSignIn: function(credential){
      //   console.log('SelectByBounds::onSignIn', credential);
      // },

      // onSignOut: function(){
      //   console.log('SelectByBounds::onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('SelectByBounds::onPositionChange');
      // },

      // resize: function(){
      //   console.log('SelectByBounds::resize');
      // }

      //methods to communication between widgets:

    });

  });
