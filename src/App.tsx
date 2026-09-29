import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type PetStatus = 'AVAILABLE' | 'PENDING' | 'SOLD'

type Pet = {
  id: number
  name: string
  category: string
  status: PetStatus
  price: number
  description?: string | null
}

type PetForm = {
  name: string
  category: string
  status: PetStatus
  price: string
  description: string
}

const API_BASE = ''
const STATUS_OPTIONS: PetStatus[] = ['AVAILABLE', 'PENDING', 'SOLD']

const createEmptyForm = (): PetForm => ({
  name: '',
  category: '',
  status: 'AVAILABLE',
  price: '',
  description: '',
})

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Request failed')
  }

  return (await response.json()) as T
}

function App() {
  const [pets, setPets] = useState<Pet[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | PetStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPetId, setEditingPetId] = useState<number | null>(null)
  const [form, setForm] = useState<PetForm>(createEmptyForm())

  const loadPets = async () => {
    try {
      const params = new URLSearchParams()

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }

      const query = params.toString()
      const response = await apiRequest<Pet[]>(query ? `/api/pets?${query}` : '/api/pets')
      setPets(response)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load pets from the backend.',
      )
    }
  }

  const loadCategories = async () => {
    try {
      const response = await apiRequest<string[]>('/api/pets/categories')
      setCategories(response)
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    void loadPets()
  }, [search, statusFilter])

  useEffect(() => {
    void loadCategories()
  }, [])

  useEffect(() => {
    if (pets.length || !error) {
      setLoading(false)
    }
  }, [pets, error])

  const openCreateDialog = () => {
    setEditingPetId(null)
    setForm(createEmptyForm())
    setError(null)
    setIsModalOpen(true)
  }

  const openEditDialog = (pet: Pet) => {
    setEditingPetId(pet.id)
    setForm({
      name: pet.name,
      category: pet.category,
      status: pet.status,
      price: pet.price.toString(),
      description: pet.description ?? '',
    })
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedName = form.name.trim()
    const trimmedCategory = form.category.trim()
    const trimmedDescription = form.description.trim()
    const amount = Number(form.price)

    if (!trimmedName || !trimmedCategory || !form.status || !Number.isFinite(amount) || amount < 0) {
      setError('Name, category, status, and a valid non-negative price are required.')
      return
    }

    const payload = {
      name: trimmedName,
      category: trimmedCategory,
      status: form.status,
      price: Number(amount.toFixed(2)),
      description: trimmedDescription || null,
    }

    try {
      if (editingPetId !== null) {
        await apiRequest<Pet>(`/api/pets/${editingPetId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest<Pet>('/api/pets', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setIsModalOpen(false)
      setForm(createEmptyForm())
      setEditingPetId(null)
      setError(null)
      void loadPets()
      void loadCategories()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'The pet could not be saved.',
      )
    }
  }

  const handleDelete = async (pet: Pet) => {
    const confirmed = window.confirm(`Delete ${pet.name}?`)
    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`/api/pets/${pet.id}`, { method: 'DELETE' })
      setError(null)
      void loadPets()
      void loadCategories()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'The pet could not be deleted.',
      )
    }
  }

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div>
          <p className="eyebrow">Pet store</p>
          <h1>Pet catalog</h1>
        </div>
        <button type="button" className="primary" onClick={openCreateDialog}>
          New pet
        </button>
      </header>

      <section className="filters">
        <label>
          <span>Search</span>
          <input
            type="text"
            placeholder="Name or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | PetStatus)}
          >
            <option value="ALL">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <div className="banner error">{error}</div> : null}

      <section className="panel">
        <div className="table-header">
          <h2>Pets</h2>
          <span>{pets.length} items</span>
        </div>

        {loading ? (
          <p className="empty">Loading pets...</p>
        ) : pets.length === 0 ? (
          <p className="empty">No pets match the current search.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id}>
                    <td>{pet.name}</td>
                    <td>{pet.category}</td>
                    <td>
                      <span className={`status status-${pet.status.toLowerCase()}`}>
                        {pet.status}
                      </span>
                    </td>
                    <td>${pet.price.toFixed(2)}</td>
                    <td>{pet.description || '—'}</td>
                    <td className="actions">
                      <button type="button" className="secondary" onClick={() => openEditDialog(pet)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(pet)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPetId === null ? 'New pet' : 'Edit pet'}</h3>
              <button type="button" className="ghost" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pet-form">
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label>
                <span>Category</span>
                <input
                  type="text"
                  list="category-list"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                />
                <datalist id="category-list">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as PetStatus }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save pet
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
