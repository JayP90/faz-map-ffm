<template>
  <div class="faz-select" ref="select">
    <div class="title" v-if="title">
      {{title}}
    </div>
    <div role="button" class="select option" @click="click($event)">
      <div v-show="!toggle || !search">
        {{label}}
      </div>
      <div class="input" v-show="toggle && search">
        <input v-model="searchTerm" type="text" placeholder="SUCHE" ref="search">
        <div class="close" @click="close($event)"></div>
      </div>
    </div>
    <transition name="fade-options">
      <div v-if="toggle" class="group" :style="{'max-height': (maxHeight - 52) + 'px'}">
        <div role="button" v-for="option in options" v-if="option[labelKey].toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1" class="option" :class="{selected: value === option[valueKey]}" @click="select(option[valueKey])">
          {{option[labelKey]}}
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'faz-select',
  props: {
    options: Array,
    value: {
      type: [String, Number, Boolean],
      default: null
    },
    placeholder: String,
    search: {
      type: Boolean,
      default: false
    },
    maxHeight: {
      type: Number,
      default: null
    },
    title: String,
    valueKey: {
      type: String,
      default: 'val'
    },
    labelKey: {
      type: String,
      default: 'label'
    }
  },
  data () {
    return {
      invalid: false,
      layout: null,
      toggle: false,
      searchTerm: ''
    }
  },
  methods: {
    click (e) {
      this.toggle = !this.toggle || this.search
      window.setTimeout(() => this.$refs.search.focus(), 0)
      e.stopPropagation()
      window.addEventListener('click', this.close, false)
    },
    select (val) {
      this.close()
      this.$emit('input', val)
    },
    close (e) {
      if (e != null) e.stopPropagation()
      this.searchTerm = ''
      this.toggle = false
      window.removeEventListener('click', this.close, false)
    }
  },
  created () {
    // console.log(this.options, this.labelKey)
  },
  watch: {
    value () {
      let option = this.options.find(opt => opt[this.valueKey] === this.value)
      if (option == null && this.placeholder == null) {
        this.$emit('input', this.options[0][this.valueKey])
      }
    },
    options () {
      let option = this.options.find(opt => opt[this.valueKey] === this.value)
      if (option == null && this.placeholder == null) {
        this.$emit('input', this.options[0][this.valueKey])
      }
    }
  },
  computed: {
    label () {
      if (this.options == null) return this.placeholder
      let opt = this.options.find(opt => opt[this.valueKey] === this.value)
      if (opt == null) return this.placeholder
      return opt[this.labelKey]
    }
  }
}
</script>

<style scoped lang="scss">
  $C_DEFAULT: #999999;
  $C_HIGHLIGHT: #000;
  $C_WHITE: #FFFFFF;

  .faz-select {
    box-sizing: border-box;
    display: block;
    position: relative;
    max-width: 360px;

    .title {
      font-family: FAZGoldSans-Regular, "FAZGoldSans-Regular", helvetica neue,helvetica, Arial,Helvetica, sans-serif;
      color: $C_DEFAULT;
      font-size: 12px;
      margin-bottom: 2px;
    }

    .option {
      border: 1px solid $C_DEFAULT;
      color: $C_HIGHLIGHT;
      font-family: FAZGoldSans-Regular, "FAZGoldSans-Regular", helvetica neue,helvetica, Arial,Helvetica, sans-serif;
      box-sizing: border-box;
      padding-top: 11px;
      padding-left: 12px;
      font-size: 13px;
      text-transform: uppercase;
      cursor: default;
      transition: color .4s, background .4s;
      height: 40px;

      &:hover {
        color: $C_HIGHLIGHT;
      }

      &.selected {
        color: $C_HIGHLIGHT;
        z-index: 1;
      }

      &.select {
        border-radius: 2px;
        background: url(http://dynamic.faz.net/red/2017/wahl-frankreich-karte/resources/icons/winkel-down-small.svg) no-repeat right center;
      }

      .input {
        input {
          border: none;
          outline: none;
          font-family: FAZGoldSans-Regular, "FAZGoldSans-Regular", helvetica neue,helvetica, Arial,Helvetica, sans-serif;
          font-size: 13px;
        }
        .close {
          height: 40px;
          width: 40px;
          position: absolute;
          top: 0px;
          right: 0px;
        }
      }
    }

    .group {
      margin-top: -1px;
      position: absolute;
      z-index: 10;
      width: 100%;
      background: #fff;
      overflow-y: auto;
      border: 1px solid $C_DEFAULT;
      border-radius: 0 0 2px 2px;
      box-sizing: border-box;

      .option {
        border-top: none;
        border-left: none;
        border-right: none;
        color: $C_DEFAULT;

        &:last-of-type {
          border-bottom: none;
        }

        &.selected {
          height: 41px;
          z-index: 3;
          &:first-of-type {
            height: 40px;
            margin-top: 0px;
          }
        }

        &:hover {
          color: $C_HIGHLIGHT;
        }

        &.selected {
          color: $C_HIGHLIGHT;
          z-index: 1;
        }
      }

      &.fade-options-enter-active, &.fade-options-leave-active {
        transition: opacity .4s;
      }
      &.fade-options-enter, &.fade-options-leave-to {
        opacity: 0;
      }
    }
  }
</style>
