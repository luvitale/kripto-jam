<script setup lang="ts">
import axios from 'axios'
import { type Ref, onMounted, ref, computed, reactive } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const pesos = ref({})
const dolares = ref({})

const swapped = ref(false)

type Price = {
  venta: number
  compra: number
}

const getPrices = (obj: { [x: string]: any; }, k: string = ""): Price[] => {
    let results = {} as Price[];

    // Iterate over each key-value pair in the object
    for (let key in obj) {
        if (typeof obj[key] === 'object') {
            // If the value is an object, recursively call the function
            results = {...results, ...getPrices(obj[key], `${k}-${key}`)};
        } else if (key === 'price') {
            results[k] = {
                "venta": obj[key],
                "compra": obj[key]
            } as Price;
        } else if (key === 'ask') {
            results[k] = {
                "venta": obj[key],
                "compra": obj['bid']
            } as Price;
        }
    }

    return results;
}

const prices = ref({})

onMounted(async () => {
    const response = await axios.get('https://criptoya.com/api/dolar')
    prices.value = getPrices(response.data, "dolar")
    pesos.value = {}
    dolares.value = {}
    for (let index of Object.keys(prices.value)) {
        pesos.value[index] = 0
        dolares.value[index] = 0
    }
})

const swapCoins = () => {
    Object.keys(prices.value).forEach((price) => {
        if (!swapped.value) {
            dolares.value[price] = pesos.value[price]
        } else {
            pesos.value[price] = dolares.value[price]
        }
    })

    swapped.value = !swapped.value
}

const dolaresComputed = computed(() => {
    let result = {}
    for (let price of Object.keys(prices.value)) {
        result[price] = pesos.value[price] / prices.value[price].venta
    }
    return result
})

const pesosComputed = computed(() => {
    let result = {}
    for (let price of Object.keys(prices.value)) {
        result[price] = dolares.value[price] * prices.value[price].compra
    }
    return result
})
</script>

<template>
    <div v-for="price in Object.keys(prices)">
        <a>
            {{ price.split('-').map(
                (word, index) => index <= 1 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toUpperCase()
            ).join(' ') }} {{ `${(!swapped ? prices[price].venta: prices[price].compra).toFixed(2)} ARS` }}
        </a>

        <InputNumber :id="`pesos${price}`" v-if="!swapped" mode="currency" currency="ARS" v-model="pesos[price]" />
        <InputNumber :id="`dolar${price}`" v-else mode="currency" currency="USD" v-model="dolares[price]" />

        <Button type="button" @click="swapCoins"><i class="pi pi-sync"></i></Button>
        
        <InputNumber :id="`dolar${price}`" v-if="!swapped" mode="currency" currency="USD" v-model="dolaresComputed[price]" :disabled="true" />
        <InputNumber :id="`pesos${price}`" v-else mode="currency" currency="ARS" v-model="pesosComputed[price]" :disabled="true" />
    </div>
</template>