<template>
  <div class="faz-map">
    <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="displayName" v-model="category"></faz-select>
    <choropleth v-if="map" :map="map" :category="categories[category]" v-model="hover"></choropleth>
    <transition name="fade">
      <div class="tooltip" v-if="hover" :style="{'left': hover.x + 'px', 'top': hover.y + 'px'}">{{hover.data.region}}</div>
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
      dataUrl: 'data/FFM_OBW2018_Stadtteile_WBZ.csv', //'data/results.csv',
      mapUrl: 'data/ffmwahlbezirke.geojson', //'data/wahlkreise.json',
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
      }, {
        name: 'Dr. Eskandari-Grünberg,Nargess',
        displayName: 'Nargess Eskandari-Grünberg, Grüne',
        color: '#0c9941'
      }, {
        name: 'Wißler,Janine',
        displayName: 'Janine Wißler, Linke',
        color: '#bb4894'
      }, {
        name: 'Wehnemann,Nico',
        displayName: 'Nico Wehnemann, Die Partei',
        color: '#961414'
      }]
    }
  },
  methods: {
    parseCsv (csv) {
      var dsv = d3.dsvFormat(";")

      return dsv.parse(csv, v => {
        if(!v.WkrNr || +v.WkrNr === 0) return

        let data = {
          WkrNr: +v.WkrNr,
          region: v.Wahlkreis
        }
        let max = {val: null, id: null}

        this.parties.forEach((d, i) => {
          data[d.name] = +v[d.name] / +v['Gültige Stimmen'] * 100
          //data[d.name] = +v[d.name]

          if (max.val === null || max.val < data[d.name]) {
            max.val = data[d.name]
            max.id = i
          }

          if (d.max == null || d.max < data[d.name]) {
            d.max = data[d.name]
          }
        })
        data['Stärkste Kraft'] = max.id

        console.log(data)

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
      console.log(results[1])
      var dsv = d3.dsvFormat(";");
      //console.log('dsv: ', dsv)
      this.data = this.parseCsv( results[0] )
      this.maxValues = this.parties.map(d => this.ceil(d.max))
      // console.log('map: ', this.map)
      // console.log('data: ', this.data)
      // console.log('maxValues: ', this.maxValues)
    })
  },
  watch: {
    data () {
      this.map.features.forEach(f => {
        f.properties.data = this.data.find(d => d.WkrNr === +f.properties.WBZ_Name.replace('-', '')) || {}
        f.properties.id = +f.properties.WBZ_Name.replace('-', '')
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
      padding: 2px 5px;
      position: absolute;
      color: #333;
      font-size: 14px;
      background: #fff;
      border-radius: 2px;
      transform: translateX(-50%);
      font-family: FAZGoldSans-Regular, "FAZGoldSans-Regular", helvetica neue,helvetica, Arial,Helvetica, sans-serif;
    }
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .15s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
</style>
