<template>
  <div class="choropleth">
    <svg width="100%" :height="height" ref="svg">
      <pattern id="nodata" width="6" height="6" patternUnits="userSpaceOnUse">
        <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <polygon fill="#dddddd" points="0 0 3 0 6 3 6 6"></polygon>
          <polygon fill="#dddddd" points="0 3 3 6 0 6"></polygon>
        </g>
      </pattern>
      <g class="map">
        <path v-for="polygon in polygons" class="polygon" :d="polygon.path" :fill="getFill(polygon)" @mouseover="mouseover(polygon)" @mouseleave="mouseleave()"></path>
        <path v-if="hoverPath != null" class="polygon hover" :d="hoverPath"></path>
      </g>
    </svg>
    <svg class="legend" v-if="category.legend !== 'ordinal'" width="300" height="48">
      <g>
        <rect v-for="color in gradient" :x="color.x" y="8" :width="color.width" :height="8" :fill="color.fill"></rect>
        <g class="legend-labels" v-for="label in legendLabels" :transform="label.translate">
          <rect :x="label.x" y="8" width="1" :height="16"></rect>
          <text :y="36" class="legend-label">{{label.text}}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import debounce from 'debounce'

d3.formatDefaultLocale({
  'decimal': ',',
  'thousands': '.',
  'grouping': [3],
  'currency': ['', '€'],
  'dateTime': '%a %b %e %X %Y',
  'date': '%d.%m.%Y',
  'time': '%H:%M:%S',
  'periods': ['AM', 'PM'],
  'days': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  'months': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  'shortMonths': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
})

export default {
  name: 'choropleth',
  props: {
    map: Object,
    domain: {
      type: Array,
      default () {
        return [0, 0.5]
      }
    },
    range: {
      type: Array,
      default () {
        return ['#182A35', '#80ED9F']
      }
    },
    category: Object,
    maxHeight: {
      type: Number,
      default: 700
    },
    value: Object
  },
  data () {
    return {
      projection: d3.geoMercator(),
      polygons: [],
      height: this.maxHeight
    }
  },
  methods: {
    fitProjection () {
      let width = this.$refs.svg.getBoundingClientRect().width
      let height = this.maxHeight

      this.projection.scale(1).translate([0, 0])
      var b = this.path.bounds(this.map)
      var s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height)

      this.height = (b[1][1] - b[0][1]) * s

      var t = [(width - s * (b[1][0] + b[0][0])) / 2, (this.height - s * (b[1][1] + b[0][1])) / 2]

      this.projection
        .scale(s)
        .translate(t)

      this.polygons = this.map.features.map(f => {
        return {
          path: this.path(f),
          feature: f
        }
      })
    },
    getFill (polygon) {
      return this.colorScale(polygon.feature.properties.data[this.category.name])
    },
    mouseover (polygon) {
      let centroid = this.path.centroid(polygon.feature)

      this.$emit('input', {
        data: polygon.feature.properties.data,
        x: Math.round(centroid[0]),
        y: Math.round(centroid[1]),
        id: +polygon.feature.properties.WBZ_Name.replace('-', '')
      })
    },
    mouseleave (polygon) {
      this.$emit('input', null)
    }
  },
  mounted () {
    this.fitProjection()
    window.addEventListener('resize', debounce(this.fitProjection, 250))
  },
  watch: {
  },
  computed: {
    path () {
      return d3.geoPath().projection(this.projection)
    },
    colorScale () {
      return d3.scaleLinear().domain(this.category.domain || this.domain).range(this.category.colorRange || this.range)
    },
    hoverPath () {
      if (this.value == null) return null
      return this.polygons.find(p => {
        return +p.feature.properties.WBZ_Name.replace('-', '') === this.value.id
      }).path
    },
    gradient () {
      let stepSize = (this.category.domain ? this.category.domain[1] : this.domain[1]) < 0.15 ? 0.025 : 0.05
      let steps = (this.category.domain ? this.category.domain[1] : this.domain[1]) / stepSize

      return '.'.repeat(steps).split('').map((d, i) => {
        return {
          fill: this.colorScale(stepSize * i),
          x: 16 + (i / steps) * (300 - 32),
          width: (300 - 32) / steps
        }
      })
    },
    legendLabels () {
      console.log(this.category.domain)
      return [{
        translate: 'translate(16, 0)',
        text: '0%'
      }, {
        translate: `translate(${300 - 16}, 0)`,
        text: d3.format('.0%')(this.category.domain ? this.category.domain[1] : this.domain[1])
      }]
    }
  }
}
</script>

<style scoped lang='scss'>
.choropleth {
  box-sizing: border-box;
  padding: 16px;

  .legend {
    margin-top: 16px;
    left: 50%;
    transform: translateX(-50%);
    position: relative;

    .legend-label {
      font-family: Verdana, sans-serif;
      text-anchor: middle;
      font-size: 12px;
    }
  }

  .map {
    .polygon {
      stroke: #fff;
      stroke-width: 0.5;

      &.hover {
        stroke-width: 1.5;
        fill: none;
      }
    }
  }
}
</style>
