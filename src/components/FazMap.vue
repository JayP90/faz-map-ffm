<template>
  <div class="faz-map">
    <!-- <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="displayName" v-model="category" @input="lastSelected = 'select'"></faz-select>
    <div @click="next()">next</div>
    <div @click="prev()">prev</div> -->
    <div class="controls">
      <vue-slider
            :min="500"
            :max="5000"
            :interval="100"
            :tooltip="false"
            v-model="sliderVal">
      </vue-slider>
      {{ sliderVal }}
      <br>
      <label v-for="size in flatSizes" :for="size">
        <input type="radio" :value="size" name="flatSizeInput" :checked="size == flatSize" v-model="flatSize"> {{size}}qm
      </label>
    </div>
    <choropleth v-if="map" :geojsonConfig="geojsonConfig" :map="map" :category="categories[this.category - 1]" :parties="config" v-model="hover"></choropleth>
    <transition name="fade">
      <div class="tooltip" v-if="hover" :style="{'left': hover.x + 100 + 'px', 'top': hover.y + -50 + 'px'}">
        <b>{{hover.data.region}}</b> ({{hover.data.id}})<br>
        {{hover.data['miete']}}€ pro qm <br>

        {{ hover.data['miete'] * flatSize }}€ Miete für {{ flatSize }}qm
        <!-- <ul>
          <li v-for="item in config">
            <div :style="{ background: item.color, width: Math.round(hover.data[item.name]) + '%' }" style="height:10px"></div>
            {{item.displayName}}: {{ hover.data[item.name] }}€
          </li>
        </ul> -->
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
      // dataUrl: 'data/empirica_data.csv',
      dataUrl: 'data/export.csv',
      // dataUrl: 'data/FFM_OBW2018Stich_Stadtteile_WBZ-UTF8-TEST.csv',
      // mapUrl: 'http://dynamic.faz.net/red/2018/ob_wahl/data/ffmwahlbezirke.geojson', 
      // mapUrl: 'data/ffmwahlbezirke.geojson',
      mapUrl: 'data/ffmstadtbezirkewahlen.geojson',
      data: null,
      map: null,
      category: 1,
      hover: null,
      baseColor: '#ccc',
      maxValues: {},
      minValues: {},
      sliderVal: 2200,
      flatSizes: [40,70,90,120],
      flatSize: 70,
      geojsonConfig: {
        propertyId: 'TXT_STB',
        propertyName: 'STB_Name'
      },
      dataConfig: {
        // displayName: 'Stadtteil', // name in data to be displayed at geojson feature
        displayName: 'stadtteil', // name in data to be displayed at geojson feature
        id: 'id' // id in data to match geojson feature
      },
      lastSelected: 'story',
      // currentStory: 0,
      // storyConfig: [{
      //   name: 'Kaufpreis 2012 etw',
      // },
      // {
      //   name: 'Kaufpreis 2012 ezfh',
      // },
      // {
      //   name: 'Kaufpreis 2012 etw',
      // }],
      // config: [
      // {
      //   name: 'Kaufpreis pro qm 2018 etw',
      //   displayName: 'Kaufpreis pro qm 2018 etw',
      //   color: '#c51d1e',
      //   unit: 'qm'
      // },
      // {
      //   name: 'Kaufpreis pro qm 2018 ezfh',
      //   displayName: 'Kaufpreis pro qm 2018 ezfh',
      //   color: '#c51d1e',
      //   unit: '€'
      // },
      // {
      //   name: 'Miete pro qm 2018',
      //   displayName: 'Miete pro qm 2018',
      //   color: '#c51d1e',
      //   unit: '€'
      // }]
      config: [
      {
        name: 'miete',
        displayName: 'Mietpreis pro qm 2018',
        color: '#c51d1e',
        unit: 'qm'
      },
      {
        name: 'kauf',
        displayName: 'Kaufpreis pro qm 2018',
        color: '#c51d1e',
        unit: '€'
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
        data['Bezahlbarkeit'] = (v['miete'] * this.flatSize) / this.sliderVal * 100

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
    sliderVal () {
      this.data.forEach(item => item['Bezahlbarkeit'] = (item['miete'] * this.flatSize) / this.sliderVal * 100)
    },
    flatSize () {
      this.data.forEach(item => item['Bezahlbarkeit'] = (item['miete'] * this.flatSize) / this.sliderVal * 100)
    },
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
    story () {
      return this.storyConfig.map((d, i) => {
        return {...d, ...this.categories.find(item => item.name === d.name)}
      })
    },
    categories () {
      let categories = [{
        name: 'Bezahlbarkeit',
        displayName: 'Bezahlbarkeit',
        id: 0,
        legend: 'ordinal',
        categories: [{label: '<33%', val: 33}, {label: '<40%', val: 40}, {label: '<50%', val: 50}, {label: '<60%', val: 60}, {label: '66%+', val: 66}],
        domain: [33,40,50,60,66],
        colorRange: ['#d9ef8b', '#ffeaad', '#fdae61', '#d73027', '#a50026']
      }]

      // let list = this.config.map((d, i) => {
      //   return {
      //     name: d.name,
      //     displayName: d.displayName,
      //     unit: d.unit,
      //     id: i + 1,
      //     type: 'party',
      //     domain: [this.minValues[i], this.maxValues[i]],
      //     colorRange: [d3.hsl(d.color).brighter(2), d.color]
      //   }
      // })

      // return categories.concat(parties)
      // return list
      return categories
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
  .controls {
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(255,255,255,.5);
    padding: 20px;
    width: 300px;
  }
</style>
