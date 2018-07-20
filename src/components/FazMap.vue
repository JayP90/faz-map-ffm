<template>
  <div class="faz-map">
    <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="displayName" v-model="category"></faz-select>
    <choropleth v-if="map" :map="map" :category="categories[category]" :parties="parties" v-model="hover"></choropleth>
    <transition name="fade">
      <div class="tooltip" v-if="hover" :style="{'left': hover.x + 'px', 'top': hover.y + 'px'}">
        {{hover.data.region}}<br>
        <ul>
          <li v-for="party in parties">
            <div :style="{ background: party.color, width: Math.round(hover.data[party.name]*100) + '%' }" style="height:10px"></div>
            {{party.displayName}}: {{ Math.round(hover.data[party.name]*100)}}%
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
      dataUrl: 'data/FFM_OBW2018_Stadtteile_WBZ_offiziell.csv',
      // dataUrl: 'data/FFM_OBW2018Stich_Stadtteile_WBZ-UTF8-TEST.csv',
      // mapUrl: 'http://dynamic.faz.net/red/2018/ob_wahl/data/ffmwahlbezirke.geojson', 
      // mapUrl: 'data/ffmwahlbezirke.geojson',
      mapUrl: 'data/ffmstadtbezirkewahlen.geojson',
      data: null,
      map: null,
      category: 0,
      hover: null,
      baseColor: '#F3F3F3',
      maxValues: {},
      parties: [{
        name: 'Dr. Weyland,Bernadette',
        displayName: 'Bernadette Weyland, CDU',
        color: '#111111'
      }, {
        name: 'Feldmann,Peter',
        displayName: 'Peter Feldmann, SPD',
        color: '#c51d1e'
      }/*, {
        name: 'Dr. Eskandari-Grünberg,Nargess',
        displayName: 'Nargess Eskandari-Grünberg, Grüne',
        color: '#0c9941'
      }, {
        name: 'Wißler,Janine',
        displayName: 'Janine Wißler, Linke',
        color: '#bb4894'
      }, {
        name: 'Stein,Volker',
        displayName: 'Volker Stein, unabhängig',
        color: '#2b7ab4'
      }*/]
    }
  },
  methods: {
    parseCsv (csv) {
      var dsv = d3.dsvFormat(";")

      return dsv.parse(csv, (v, j) => {
        if(!v.WkrNr || +v.WkrNr === 0) return

        let data = {
          WkrNr: +v.WkrNr,
          region: v.Wahlkreis
        }
        let max = {val: null, id: null}
        this.parties.forEach((d, i) => {
          data[d.name] = +v[d.name] / +v['Gültige Stimmen'].replace('.', '')
          // data[d.name] = +v[d.name]

          if (max.val === null || max.val < data[d.name]) {
            max.val = data[d.name]
            max.id = i
          }

          if (d.max == null || d.max < data[d.name]) {
            d.max = data[d.name]
          }
        })
        data['Stärkste Kraft'] = max.id

        //console.log(data)

        return data
      })
    },
    ceil (val) {
      return Math.ceil(val / 0.05) * 0.05
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
      this.maxValues = this.parties.map(d => this.ceil(d.max))
      // console.log('map: ', this.map)
      //console.log('data: ', this.data)
      // console.log('maxValues: ', this.maxValues)
    })
  },
  watch: {
    data () {
      this.map.features.forEach(f => {
        f.properties.data = this.data.find(d => d.WkrNr === +f.properties.STB_Name.replace('-', '')) || {}
        f.properties.id = +f.properties.STB_Name.replace('-', '')
      })
    }
  },
  computed: {
    categories () {
      let categories = [{
        name: 'Stärkste Kraft',
        displayName: 'Stärkste Kraft',
        id: 0,
        legend: 'ordinal',
        categories: this.parties.map((d, i) => { return {label: d.name, val: i} }),
        domain: this.parties.map((d, i) => i),
        colorRange: this.parties.map((d) => d.color)
      }]

      let parties = this.parties.map((d, i) => {
        return {
          name: d.name,
          displayName: d.displayName,
          id: i + 1,
          type: 'party',
          domain: [0, this.maxValues[i]],
          colorRange: [this.baseColor, d.color]
        }
      })

      return categories.concat(parties)
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
