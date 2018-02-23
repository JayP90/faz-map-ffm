<template>
  <div class="faz-map">
    <faz-select :map="map" :options="categories" :search="true" value-key="id" label-key="name" v-model="category"></faz-select>
    <choropleth v-if="map" :map="map" :category="categories[category]" v-model="hover"></choropleth>
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
        color: '#333333'
      }, {
        name: 'Feldmann,Peter',
        color: '#FF0000'
      }, {
        name: 'Dr. Eskandari-Grünberg,Nargess',
        color: '#008D00'
      }, {
        name: 'Wißler,Janine',
        color: '#D90063'
      }, {
        name: 'Wehnemann,Nico',
        color: '#FFD700'
      }]
    }
  },
  methods: {
    parseCsv (csv) {
      var dsv = d3.dsvFormat(";")

      return dsv.parse(csv, v => {
        console.log(v)
        let data = {
          WkrNr: +v.WkrNr,
          region: v.Wahlkreis
        }
        let max = {val: null, id: null}
        this.parties.forEach((d, i) => {
          data[d.name] = +v[d.name] / +v.Insgesamt

          if (max.val === null || max.val < data[d.name]) {
            max.val = data[d.name]
            max.id = i
          }

          if (d.max == null || d.max < data[d.name]) {
            d.max = data[d.name]
          }
        })
        data['Stärkste Kraft'] = max.id
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
      //console.log('dsv: ', dsv)
      this.data = this.parseCsv( results[0] )
      this.maxValues = this.parties.map(d => this.ceil(d.max))
      console.log('map: ', this.map)
      console.log('data: ', this.data)
      console.log('maxValues: ', this.maxValues)
    })
  },
  watch: {
    data () {
      this.map.features.forEach(f => {
        f.properties.data = this.data.find(d => d.WkrNr === f.properties.WKR_NR) || {}
        f.properties.id = f.properties.WKR_NR
      })
    }
  },
  computed: {
    categories () {
      let categories = [{
        name: 'Stärkste Kraft',
        id: 0,
        legend: 'ordinal',
        categories: this.parties.map((d, i) => { return {label: d.name, val: i} }),
        domain: this.parties.map((d, i) => i),
        colorRange: this.parties.map((d) => d.color)
      }]

      let parties = this.parties.map((d, i) => {
        return {
          name: d.name,
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
  }
</style>
