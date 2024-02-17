<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref, computed } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const dolarTarjeta = ref(0)

const pesosDolarTarjeta = ref(0)
const dolarTarjetaPesos = ref(0)

const swapped = ref(false)

onMounted(async () => {
    const response = await axios.get('https://criptoya.com/api/dolar')
    dolarTarjeta.value = response.data.tarjeta.price
})

const dolarTarjetaPesosComputed = computed(() => {
  return pesosDolarTarjeta.value / dolarTarjeta.value
})

const pesosDolarTarjetaComputed = computed(() => {
  return dolarTarjetaPesos.value * dolarTarjeta.value
})

const swapCoins = () => {
    swapped.value = !swapped.value
}
</script>

<template>
Dólar Tarjeta: {{ `${dolarTarjeta.toFixed(2)} ARS` }}

<InputNumber id="pesosDolarTarjeta" v-if="!swapped" mode="currency" currency="ARS" v-model="pesosDolarTarjeta" />
<InputNumber id="dolarTarjetaPesos" v-else mode="currency" currency="USD" v-model="dolarTarjetaPesos" />
<Button type="button" @click="swapCoins"><i class="pi pi-sync"></i></Button>
<InputNumber id="dolarTarjetaPesos" v-if="!swapped" mode="currency" currency="USD" v-model="dolarTarjetaPesosComputed" :disabled="true" />
<InputNumber id="pesosDolarTarjeta" v-else mode="currency" currency="ARS" v-model="pesosDolarTarjetaComputed" :disabled="true" />
</template>