import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        // @ts-ignore
        if ((globalThis as any).api?.inventory?.getProducts) {
          // @ts-ignore
          const p = await (globalThis as any).api.inventory.getProducts()
          setProducts(p)
          return
        }
      } catch (e) {
        console.error(e)
      }
      setProducts([
        { id: 'p1', name: 'Product A', sku: 'A-1', price: 10, stock: 100 },
        { id: 'p2', name: 'Product B', sku: 'B-1', price: 20, stock: 5 }
      ])
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-2">Products</h3>
          <Table columns={["ID", "Name", "SKU", "Price", "Stock"]} data={products.map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock }))} />
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Low stock</h3>
          <div className="space-y-2">
            {products.filter(p => p.stock < 10).map(p => (
              <div key={p.id} className="p-2 border rounded">{p.name} — {p.stock}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
