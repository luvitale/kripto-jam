<script setup lang="ts">
import axios from 'axios'
import { type Ref, onMounted, ref, computed, reactive } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

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

const onRowReorder = (event) => {
    console.log(event)
    console.log(event.value);
    event.value.forEach((element, index) => {
        prices.value[element.cambio].priority = index
        localStorage.setItem(element.cambio, index.toString())
    });
};
</script>

<template>
    <DataTable :value="Object.entries(prices).map(([currency, values]) => ({ cambio: currency, ...values }))"
        :reorderableColumns="true" sort-field="priority" :sort-order="1" @column-reorder="" @row-reorder="onRowReorder">
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
    </DataTable>
</template>