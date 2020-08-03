import React, { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios'

import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'

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

  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')

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

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;

    setSelectedUf(uf)
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;

    setSelectedCity(city)
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

      <form>
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
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input 
                type="email"
                name="email"
                id="email"
              />
            </div>
                    
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input 
                type="text"
                name="whatsapp"
                id="whatsapp"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereco no mapa</span>
          </legend>

          <Map center={[-6.419492, -35.1818588]} zoom={15}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[-6.419492, -35.1818588]} />
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
              <li key={item.id}>
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