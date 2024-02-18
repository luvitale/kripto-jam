<script setup lang="ts">
import axios from 'axios'
import { type Ref, onMounted, ref, computed, reactive } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'

const pesos = ref({})
const dolares = ref({})

const priority = ref(-1)

const swapped = ref(false)

type Price = {
  venta: number
  compra: number
}

const getPrices = (obj: { [x: string]: any }, k: string = ""): { [x: string]: Price } => {
    let results = {} as { [x: string]: Price };

    // Iterate over each key-value pair in the object
    for (let key in obj) {
        if (typeof obj[key] === 'object') {
            // If the value is an object, recursively call the function
            results = {...results, ...getPrices(obj[key], `${k}-${key}`)};
        } else if (key === 'price') {
            const priorityStoraged = localStorage.getItem(k)
            priority.value = priorityStoraged ? parseInt(priorityStoraged) : priority.value + 1
            results[k] = {
                "venta": obj[key],
                "compra": obj[key],
                "priority": priority.value
            } as Price;
        } else if (key === 'ask') {
            const priorityStoraged = localStorage.getItem(k)
            priority.value = priorityStoraged ? parseInt(priorityStoraged) : priority.value + 1
            results[k] = {
                "venta": obj[key],
                "compra": obj['bid'],
                "priority": priority.value
            } as Price;
        }
    }

    return results;
}

const prices = ref({})

const columns = ref([])

const selectedColumns = ref(columns.value)

const criptoYaApiUrl = import.meta.env.VITE_CRIPTO_YA_API_URL
const cryptoCompareApiUrl = import.meta.env.VITE_CRYPTO_COMPARE_API_URL
const cryptoCompareApiKey = import.meta.env.VITE_CRYPTO_COMPARE_API_KEY

const onToggle = (val) => {
    selectedColumns.value = columns.value.filter(col => val.includes(col));
    columns.value.forEach(col => localStorage.setItem(`column-${col.field}`, val.includes(col) ? 'true' : 'false'))
};

const priceMulti = ref([])

onMounted(async () => {
    const cryptoYaResponse = await axios.get(`${criptoYaApiUrl}/api/dolar`)
    prices.value = getPrices(cryptoYaResponse.data, "dolar")
    pesos.value = {}
    dolares.value = {}
    for (let index of Object.keys(prices.value)) {
        pesos.value[index] = 0
        dolares.value[index] = 0
    }

    columns.value = currencies.value.map((currency) => ({ field: currency, header: currency.toUpperCase() }))
    currencies.value.forEach(currency => localStorage.getItem(`column-${currency}`))
    selectedColumns.value = columns.value.filter(col => localStorage.getItem(`column-${col.field}`) === 'true')

    const cryptoCompareResponse = await axios.get(`${cryptoCompareApiUrl}/data/pricemulti?fsyms=USD&tsyms=${currencies.value.join(',')}&api_key=${cryptoCompareApiKey}`)
    priceMulti.value = cryptoCompareResponse.data.USD

    btcValue.value = localStorage.getItem('btc-value') || "BTC"
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

const currencies: Ref<string[]> = ref(['brl', 'btc', 'eur'])

const currencyComputed = computed(() => {
    let result = {}
    for (let currency of currencies.value) {
        result[currency] = {}
        for (let price of Object.keys(prices.value)) {
            result[currency][price] = (!swapped.value ?
                dolaresComputed.value[price] :
                dolares.value[price]
            ) * priceMulti.value[currency.toUpperCase()]
        }
    }
    return result
})

const onRowReorder = (event) => {
    console.log(event)
    console.log(event.value);
    event.value.forEach((element, index) => {
        prices.value[element.cambio].priority = index
        localStorage.setItem(element.cambio, index.toString())
    });
};

const onChangeBtcValue = (event) => {
    if (event.value == null) {
        event.value = "BTC"
    }
    btcValue.value = event.value
    localStorage.setItem('btc-value', event.value)
}

const btcValue = ref("BTC")
const btcOptions = ref(["BTC", "bits", "satoshis"])
</script>

<template>
    <DataTable :value="Object.entries(prices).map(([currency, values]) => ({ cambio: currency, ...values }))"
        :reorderableColumns="true" sort-field="priority" :sort-order="1" @column-reorder="" @row-reorder="onRowReorder">
        <template #header>
            <div style="text-align:left">
                <MultiSelect :modelValue="selectedColumns" :options="columns" optionLabel="header" @update:modelValue="onToggle"
                    display="chip" placeholder="Seleccioná columnas" />
            </div>
            <div style="text-align:right">
                <SelectButton v-if="selectedColumns.map(col => col.field).includes('btc')" v-model="btcValue" @change="onChangeBtcValue" :options="btcOptions" />
            </div>
        </template>

        <Column rowReorder headerStyle="width: 3rem" :reorderableColumn="false" />
        <Column field="cambio" header="Tipo de cambio">
            <template #body="slotProps">
                {{ slotProps.data.cambio.split('-').map(
                (word, index) => index <= 1 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toUpperCase()
            ).join(' ') }} {{ `${(!swapped ? slotProps.data.venta: slotProps.data.compra).toFixed(2)} ARS` }}
            </template>
        </Column>
        <Column field="monto-a-convertir" header="Monto a convertir">
            <template #body="slotProps">
                <InputNumber :id="`pesos${slotProps.data.cambio}`" v-if="!swapped" mode="currency" currency="ARS" v-model="pesos[slotProps.data.cambio]" />
                <InputNumber :id="`dolar${slotProps.data.cambio}`" v-else mode="currency" currency="USD" v-model="dolares[slotProps.data.cambio]" />
            </template>
        </Column>
        <Column field="swap" header="Swap">
            <template #body>
                <Button type="button" @click="swapCoins"><i class="pi pi-sync"></i></Button>
            </template>
        </Column>
        <Column field="monto-convertido" header="Monto convertido" >
            <template #body="slotProps">
                <InputNumber :id="`dolar${slotProps.data.cambio}`" v-if="!swapped" mode="currency" currency="USD" v-model="dolaresComputed[slotProps.data.cambio]" :disabled="true" />
                <InputNumber :id="`pesos${slotProps.data.cambio}`" v-else mode="currency" currency="ARS" v-model="pesosComputed[slotProps.data.cambio]" :disabled="true" />
            </template>
        </Column>
        <Column v-for="col in selectedColumns" :key="col.field" :field="col.field" :header="col.header">
            <template #body="slotProps">
                <a v-if="col.field === 'btc' && btcValue === 'bits'">{{ (currencyComputed[col.field][slotProps.data.cambio] * 1000000).toFixed(2) }} bits</a>
                <a v-else-if="col.field === 'btc' &&btcValue === 'satoshis'">{{ (currencyComputed[col.field][slotProps.data.cambio] * 100000000).toFixed(2) }} satoshis</a>
                <InputNumber v-else :id="`${col.field}${slotProps.data.cambio}`" mode="currency" :currency="col.header" v-model="currencyComputed[col.field][slotProps.data.cambio]" :disabled="true" />
            </template>
        </Column>
    </DataTable>
</template>