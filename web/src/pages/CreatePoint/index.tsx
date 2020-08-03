import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios'

import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'

import api from '../../services/api'

import logo from '../../assets/logo.svg'
import './styles.css'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface UFResponse {
  geonames: [{
    adminCodes1: {ISO3166_2: string}
    geonameId: string
  }];
}

interface CityResponse {
  geonames: [{
    name: string
  }]
}

interface Ufs {
  initial: string;
  code: string
}

const CreatePoint: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<Ufs[]>([{
    initial: '', 
    code: ''
  }])
  const [cities, setCities] = useState<string[]>([])
  
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })

  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0])

  const history = useHistory();

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    })
  }, []);

  useEffect(() => {
    axios
      .get<UFResponse>('http://www.geonames.org/childrenJSON?geonameId=3469034')
      .then(response => {
        const ufInitials = response.data.geonames.map(uf => { 
          return {
            initial: uf.adminCodes1.ISO3166_2, 
            code: uf.geonameId
          }
        });

        setUfs(ufInitials)
      })
  }, [])

  useEffect(() => {
    if(selectedUf === '0'){
      return;
    }

    const currentUf = ufs.filter(uf => uf.initial === selectedUf)
    
    axios
      .get<CityResponse>(`http://www.geonames.org/childrenJSON?geonameId=${currentUf[0].code}`)
      .then(response => {
        const cityName = response.data.geonames.map(city => city.name)

        setCities(cityName)
      })
  }, [selectedUf])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude])
    })
  }, [])

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;

    setSelectedUf(uf)
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;

    setSelectedCity(city)
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat, event.latlng.lng
    ])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    
    setFormData({...formData, [name]: value })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)

    if(alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id);

      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
    }

  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = {
      name, 
      email, 
      whatsapp,
      uf, 
      city,
      latitude,
      longitude,
      items
    }

    await api.post('points', data)

    alert('Ponto de coleta criado!')

    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input 
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input 
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
                    
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input 
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereco no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select 
                name="uf" 
                id="uf" 
                value={selectedUf} 
                onChange={handleSelectUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf.code} value={uf.initial}>{uf.initial}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                name="city" 
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione umaa cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>ítens de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => (
              <li 
                key={item.id} 
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title}/>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
      
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
}

export default CreatePoint;