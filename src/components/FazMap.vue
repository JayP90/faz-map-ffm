<template>
  <div class="faz-map">
    <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="displayName" v-model="category" @input="lastSelected = 'select'"></faz-select>
    <div @click="next()">next</div>
    <div @click="prev()">prev</div>
    <vue-slider
          :min="0"
          :max="10"
          :interval="1"
          :piecewise="true"
          :tooltip="false"
          v-model="sliderVal">
    </vue-slider>
    {{ sliderVal }}
    <choropleth v-if="map" :geojsonConfig="geojsonConfig" :map="map" :category="displayData" :parties="config" v-model="hover"></choropleth>
    <transition name="fade">
      <div class="tooltip" v-if="hover" :style="{'left': hover.x + 100 + 'px', 'top': hover.y + -50 + 'px'}">
        {{hover.data.region}}<br>
        {{hover.data.id}}<br>
        <ul>
          <li v-for="item in config">
            <div :style="{ background: item.color, width: Math.round(hover.data[item.name]) + '%' }" style="height:10px"></div>
            {{item.displayName}}: {{ hover.data[item.name] }}€
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import fetch from 'unfetch'
//import {csvParse} from 'd3'
//import {dsvParse} from 'd3'
import * as d3 from 'd3'
import vueSlider from 'vue-slider-component';

import Choropleth from './Choropleth.vue'
import FazSelect from './FazSelect.vue'

export default {
  name: 'faz-map',
  components: {
    Choropleth,
    FazSelect,
    vueSlider
  },
  data () {
    return {
      // dataUrl: 'http://dynamic.faz.net/red/2018/ob_wahl/data/FFM_OBW2018_Stadtteile_WBZ.csv', 
      dataUrl: 'data/empirica_data.csv',
      // dataUrl: 'data/FFM_OBW2018Stich_Stadtteile_WBZ-UTF8-TEST.csv',
      // mapUrl: 'http://dynamic.faz.net/red/2018/ob_wahl/data/ffmwahlbezirke.geojson', 
      // mapUrl: 'data/ffmwahlbezirke.geojson',
      mapUrl: 'data/ffmstadtteilewahlen.geojson',
      data: null,
      map: null,
      category: 1,
      hover: null,
      baseColor: '#ccc',
      maxValues: {},
      minValues: {},
      sliderVal: 0,
      geojsonConfig: {
        propertyId: 'STTLNR',
        propertyName: 'STTLNAME'
      },
      dataConfig: {
        displayName: 'Stadtteil', // name in data to be displayed at geojson feature
        id: 'id' // id in data to match geojson feature
      },
      lastSelected: 'story',
      currentStory: 0,
      storyConfig: [{
        name: 'Kaufpreis 2012 etw',
      },
      {
        name: 'Kaufpreis 2012 ezfh',
      },
      {
        name: 'Kaufpreis 2012 etw',
      }],
      config: [{
        name: 'Kaufpreis pro qm 2012 etw',
        displayName: 'Kaufpreis pro qm 2012 etw',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Kaufpreis 2012 etw',
        displayName: 'Kaufpreis 2012 etw',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2012 etw',
        displayName: 'Wohnfläche 2012 etw',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Kaufpreis pro qm 2018 etw',
        displayName: 'Kaufpreis pro qm 2018 etw',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'Kaufpreis 2018 etw',
        displayName: 'Kaufpreis 2018 etw',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2018 etw',
        displayName: 'Wohnfläche 2018 etw',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'Kaufpreis pro qm 2012 ezfh',
        displayName: 'Kaufpreis pro qm 2012 ezfh',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Kaufpreis 2012 ezfh',
        displayName: 'Kaufpreis 2012 ezfh',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2012 ezfh',
        displayName: 'Wohnfläche 2012 ezfh',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'Kaufpreis pro qm 2018 ezfh',
        displayName: 'Kaufpreis pro qm 2018 ezfh',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Kaufpreis 2018 ezfh',
        displayName: 'Kaufpreis 2018 ezfh',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2018 ezfh',
        displayName: 'Wohnfläche 2018 ezfh',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'Miete pro qm 2012',
        displayName: 'Miete pro qm 2012',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Miete 2012',
        displayName: 'Miete 2012',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2012',
        displayName: 'Wohnfläche Miete 2012',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'Miete pro qm 2018',
        displayName: 'Miete pro qm 2018',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Miete 2018',
        displayName: 'Miete 2018',
        color: '#c51d1e',
        unit: '€'
      },
      {
        name: 'Wohnfläche 2018',
        displayName: 'Wohnfläche Miete 2018',
        color: '#c51d1e',
        unit: 'qm'
      }]
    }
  },
  methods: {
    next () {
      this.lastSelected = 'story'
      this.currentStory = this.currentStory + 1
      this.category = this.config.indexOf(this.config.find(item => item.name === this.storyConfig[this.currentStory].name))
    },
    prev () {
      this.lastSelected = 'story'
      this.currentStory = this.currentStory - 1
    },
    parseCsv (csv) {
      var dsv = d3.dsvFormat(",")

      return dsv.parse(csv, (v, j) => {
        if(!v.id || +v.id === 0) return

        let data = {
          id: +v[this.dataConfig.id],
          region: v[this.dataConfig.displayName]
        }
        let max = {val: null, id: null}
        let min = {val: null, id: null}
        this.config.forEach((d, i) => {
          data[d.name] = !isNaN(parseFloat(v[d.name])) ? parseFloat(v[d.name]) : d.name

          if ((max.val === null || max.val < data[d.name]) && typeof data[d.name] != 'string') {
            max.val = data[d.name]
            max.id = i
          }

          if ((d.max === undefined || d.max < data[d.name]) && typeof data[d.name] != 'string') {
            d.max = data[d.name]
          }

          if ((min.val === null || min.val > data[d.name]) && typeof data[d.name] != 'string') {
            min.val = data[d.name]
            min.id = i
          }

          if ((d.min === undefined || d.min > data[d.name]) && typeof data[d.name] != 'string') {
            d.min = data[d.name]
          }
        })
        data['Stärkste Kraft'] = max.id

        return data
      })
    },
    ceil (val) {
      return Math.ceil(val / 0.05) * 0.05
    },
    floor (val) {
      return Math.floor(val / 0.05) * 0.05
    }
  },
  created () {
    let fetches = [
      fetch(this.dataUrl).then(r => r.text()),
      fetch(this.mapUrl).then(r => r.json())
    ]
    Promise.all(fetches).then((results) => {
      this.map = results[1]
      var dsv = d3.dsvFormat(";");
      this.data = this.parseCsv( results[0] )

      this.maxValues = this.config.map(d => this.ceil(d.max))
      this.minValues = this.config.map(d => {
        return this.floor(d.min)
      })
    })
  },
  watch: {
    data () {
      this.map.features.forEach(f => {
        f.properties.data = this.data.find(d => {
          return +d.id === +f.properties[this.geojsonConfig.propertyId]
        }) || {}
        f.properties.id = +f.properties[this.geojsonConfig.propertyId]
      })
    }
  },
  computed: {
    displayData () {
      if (this.lastSelected === 'story') {
        return this.story[this.currentStory]
      } else {
        return this.categories[this.category - 1]
      }
    },
    story () {
      return this.storyConfig.map((d, i) => {
        return {...d, ...this.categories.find(item => item.name === d.name)}
      })
    },
    categories () {
      // let categories = [{
      //   name: 'Stärkste Kraft',
      //   displayName: 'Stärkste Kraft',
      //   id: 0,
      //   legend: 'ordinal',
      //   categories: this.config.map((d, i) => { return {label: d.name, val: i} }),
      //   domain: this.config.map((d, i) => i),
      //   colorRange: this.config.map((d) => d.color)
      // }]

      let list = this.config.map((d, i) => {
        return {
          name: d.name,
          displayName: d.displayName,
          unit: d.unit,
          id: i + 1,
          type: 'party',
          domain: [this.minValues[i], this.maxValues[i]],
          colorRange: [d3.hsl(d.color).brighter(2), d.color]
        }
      })

      // return categories.concat(parties)
      return list
    }
  }
}
</script>

<style scoped lang="scss">
  .faz-map {
    position: relative;
    height: 100%;

    .faz-select {
      left: 50%;
      transform: translateX(-50%);
    }

    .tooltip {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      padding: 4px 10px;
      position: absolute;
      color: #fff;
      font-size: 14px;
      line-height: 1.3;
      background: #333;
      border-radius: 2px;
      transform: translateX(-50%);
      font-family: FAZGoldSans-Regular, "FAZGoldSans-Regular", helvetica neue,helvetica, Arial,Helvetica, sans-serif;
      pointer-events: none;

      ul {
        margin: 0;
        margin-top: 1em;
        padding: 0;
        list-style: none;
        li {

        }
      }
    }
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .15s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
