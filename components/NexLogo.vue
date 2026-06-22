<template>
  <span class="inline-flex items-center leading-none whitespace-nowrap select-none" :class="gapClass">
    <!-- Icon: gradient rounded square with NX -->
    <span
      class="flex-none rounded-[0.33em] flex items-center justify-center"
      style="background: linear-gradient(140deg, #2c5fe0 0%, #5b9bff 100%)"
      :style="{ width: iconPx, height: iconPx }"
    >
      <span
        class="font-extrabold text-white"
        style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; letter-spacing:-0.04em; line-height:1"
        :style="{ fontSize: monoFontSize }"
      >N<span style="color:#16234d">X</span></span>
    </span>
    <!-- Wordmark: NEX Finance -->
    <span v-if="!iconOnly" class="inline-flex items-baseline" style="gap:0.18em">
      <span
        class="font-extrabold"
        :class="dark ? 'text-white' : 'text-[#16234d] dark:text-white'"
        style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; letter-spacing:-0.045em; line-height:1"
        :style="{ fontSize: wordFontSize }"
      >NEX</span>
      <span
        class="font-medium"
        :class="dark ? 'text-[#5b9bff]' : 'text-[#2c5fe0] dark:text-[#5b9bff]'"
        style="font-family:'Plus Jakarta Sans',system-ui,sans-serif; letter-spacing:-0.035em; line-height:1"
        :style="{ fontSize: wordFontSize }"
      >Finance</span>
    </span>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}>(), {
  iconOnly: false,
  size: 'md',
  dark: false,
})

const SIZES = {
  sm: { icon: '28px', mono: '13px', word: '15px', gap: 'gap-[7px]' },
  md: { icon: '32px', mono: '15px', word: '18px', gap: 'gap-[9px]' },
  lg: { icon: '40px', mono: '18px', word: '22px', gap: 'gap-[11px]' },
}

const iconPx = computed(() => SIZES[props.size].icon)
const monoFontSize = computed(() => SIZES[props.size].mono)
const wordFontSize = computed(() => SIZES[props.size].word)
const gapClass = computed(() => SIZES[props.size].gap)
</script>
