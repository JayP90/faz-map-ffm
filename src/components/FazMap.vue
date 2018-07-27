<template>
  <div class="faz-map">
    <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="displayName" v-model="category"></faz-select>
    <choropleth v-if="map" :geojsonConfig="geojsonConfig" :map="map" :category="categories[category - 1]" :parties="parties" v-model="hover"></choropleth>
    <transition name="fade">
      <div class="tooltip" v-if="hover" :style="{'left': hover.x + 100 + 'px', 'top': hover.y + -50 + 'px'}">
        {{hover.data.region}}<br>
        {{hover.data.id}}<br>
        <ul>
          <li v-for="party in parties">
            <div :style="{ background: party.color, width: Math.round(hover.data[party.name]) + '%' }" style="height:10px"></div>
            {{party.displayName}}: {{ hover.data[party.name] }}€
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

import Choropleth from './Choropleth.vue'
import FazSelect from './FazSelect.vue'

export default {
  name: 'faz-map',
  components: {
    Choropleth,
    FazSelect
  },
  data () {
    return {
      // dataUrl: 'http://dynamic.faz.net/red/2018/ob_wahl/data/FFM_OBW2018_Stadtteile_WBZ.csv', 
      dataUrl: 'data/empirica_etw_ezfh.csv',
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
      geojsonConfig: {
        propertyId: 'STTLNR',
        propertyName: 'STTLNAME'
      },
      dataConfig: {
        displayName: 'Stadtteil', // name in data to be displayed at geojson feature
        id: 'id' // id in data to match geojson feature
      },
      config: [{
        name: 'Kaufpreis pro qm 2012 etw',
        displayName: 'Kaufpreis pro qm 2012 etw',
        color: '#c51d1e',
        unit: '€'
      }, {
        name: 'Kaufpreis pro qm 2018 etw',
        displayName: 'Kaufpreis pro qm 2018 etw',
        color: '#c51d1e',
        unit: '€'
      }, {
        name: 'Kaufpreis pro qm 2012 ezfh',
        displayName: 'Kaufpreis pro qm 2012 ezfh',
        color: '#0c9941',
        unit: '€'
      }, {
        name: 'Kaufpreis pro qm 2018 ezfh',
        displayName: 'Kaufpreis pro qm 2018 ezfh',
        color: '#bb4894',
        unit: '€'
      }, {
        name: 'Wohnfläche 2018 ezfh',
        displayName: 'Wohnfläche 2018 ezfh',
        color: '#2b7ab4',
        unit: 'qm'
      }]
    }
  },
  methods: {
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
          data[d.name] = !isNaN(parseFloat(v[d.name])) ? parseFloat(v[d.name]) : v[d.name]

          console.log(data[d.name])

          if (max.val === null || max.val < data[d.name]) {
            max.val = data[d.name]
            max.id = i
          }

          if (d.max == null || d.max < data[d.name]) {
            d.max = data[d.name]
          }

          if (min.val === null && data[d.name] != -1 || min.val > data[d.name] && data[d.name] != -1) {
            min.val = data[d.name]
            min.id = i
          }

          if (d.min == null && data[d.name] != -1 || d.min > data[d.name] && data[d.name] != -1) {
            d.min = data[d.name]
          }
        })
        data['Stärkste Kraft'] = max.id

        console.log(data)

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
      // console.log('results: ', results[0])
      this.data = this.parseCsv( results[0] )

      console.log(this.data)

      this.maxValues = this.config.map(d => this.ceil(d.max))
      this.minValues = this.config.map(d => {
        console.log(d)
        return this.floor(d.min)
      })

      console.log(this.maxValues)
      console.log(this.minValues)

      // console.log('map: ', this.map)
      //console.log('data: ', this.data)
      // console.log('maxValues: ', this.maxValues)
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
