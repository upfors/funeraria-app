import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Navigation, DollarSign, CheckCircle, Clock, User, TrendingUp, Activity, Map, Crosshair, AlertCircle, Download, RotateCcw, Wifi, WifiOff, Target } from 'lucide-react';

// ============================================================
// CONFIGURACIÓN DE API KEY (LEER DESDE VARIABLE DE ENTORNO)
// ============================================================
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'TU_API_KEY_AQUI';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AppRutasCobros() {
  // -------------------- ESTADOS --------------------
  const [clientes, setClientes] = useState(() => {
    const saved = localStorage.getItem('clientes');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, nombre: 'Familia Pérez', direccion: 'Av. Paseo de la Reforma 222, Juárez, CDMX', lat: 19.4326, lng: -99.1332, montoFijo: 500, visitado: false, cobrado: false },
      { id: 2, nombre: 'Familia García', direccion: 'Av. Insurgentes Sur 601, Nápoles, CDMX', lat: 19.3907, lng: -99.1715, montoFijo: 750, visitado: false, cobrado: false },
      { id: 3, nombre: 'Familia López', direccion: 'Polanco, Miguel Hidalgo, CDMX', lat: 19.4338, lng: -99.1870, montoFijo: 600, visitado: false, cobrado: false },
      { id: 4, nombre: 'Familia Martínez', direccion: 'Av. Universidad 3000, Coyoacán, CDMX', lat: 19.3244, lng: -99.1772, montoFijo: 450, visitado: false, cobrado: false },
      { id: 5, nombre: 'Familia Sánchez', direccion: 'Centro Histórico, Cuauhtémoc, CDMX', lat: 19.4326, lng: -99.1332, montoFijo: 800, visitado: false, cobrado: false },
    ];
  });

  const [ruta, setRuta] = useState(() => {
    const saved = localStorage.getItem('ruta');
    return saved ? JSON.parse(saved) : [];
  });

  const [ubicacionActual, setUbicacionActual] = useState(() => {
    const saved = localStorage.getItem('ubicacionActual');
    return saved ? JSON.parse(saved) : null;
  });

  const [historial, setHistorial] = useState(() => {
    const saved = localStorage.getItem('historial');
    return saved ? JSON.parse(saved) : [];
  });

  const [vistaActiva, setVistaActiva] = useState('mapa');
  const [totalCobrado, setTotalCobrado] = useState(() => {
    const saved = localStorage.getItem('totalCobrado');
    return saved ? parseFloat(saved) : 0;
  });

  // Estados para Google Maps
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const currentLocationMarkerRef = useRef(null);

  // Estado para modo offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const mapRef = useRef(null);

  // -------------------- PERSISTENCIA AUTOMÁTICA --------------------
  useEffect(() => {
    localStorage.setItem('clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('ruta', JSON.stringify(ruta));
  }, [ruta]);

  useEffect(() => {
    localStorage.setItem('ubicacionActual', JSON.stringify(ubicacionActual));
  }, [ubicacionActual]);

  useEffect(() => {
    localStorage.setItem('historial', JSON.stringify(historial));
  }, [historial]);

  useEffect(() => {
    localStorage.setItem('totalCobrado', totalCobrado.toString());
  }, [totalCobrado]);

  // -------------------- DETECTAR ONLINE/OFFLINE --------------------
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // -------------------- CARGA DE GOOGLE MAPS --------------------
  useEffect(() => {
    if (window.google || GOOGLE_MAPS_API_KEY === 'TU_API_KEY_AQUI') {
      if (GOOGLE_MAPS_API_KEY !== 'TU_API_KEY_AQUI') setMapLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => console.error('Error cargando Google Maps');
    document.head.appendChild(script);
  }, []);

  // -------------------- INICIALIZAR MAPA --------------------
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map || GOOGLE_MAPS_API_KEY === 'TU_API_KEY_AQUI') return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 19.4326, lng: -99.1332 },
      zoom: 12,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#2d3a4b" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f1f5f9" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
      ],
    });

    setMap(newMap);
    const renderer = new window.google.maps.DirectionsRenderer({
      map: newMap,
      suppressMarkers: false,
      polylineOptions: { strokeColor: "#d4af37", strokeWeight: 4 },
    });
    setDirectionsRenderer(renderer);
  }, [mapLoaded, map]);

  // -------------------- ACTUALIZAR MARCADORES --------------------
  useEffect(() => {
    if (!map || !window.google) return;
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = clientes.map(cliente => {
      const icon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: cliente.cobrado ? '#10b981' : cliente.visitado ? '#3b82f6' : '#94a3b8',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 10,
      };
      const marker = new window.google.maps.Marker({
        position: { lat: cliente.lat, lng: cliente.lng },
        map,
        title: cliente.nombre,
        icon,
      });
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color: #1e293b; padding: 8px;"><h3 style="margin:0 0 8px 0; font-weight:bold;">${cliente.nombre}</h3><p style="margin:0 0 4px 0; font-size:14px;">${cliente.direccion}</p><p style="margin:0; font-size:16px; color:#d4af37; font-weight:bold;">$${cliente.montoFijo.toFixed(2)}</p><p style="margin:4px 0 0 0; font-size:12px; color:${cliente.cobrado ? '#10b981' : cliente.visitado ? '#3b82f6' : '#64748b'};">${cliente.cobrado ? '✓ Cobrado' : cliente.visitado ? '✓ Visitado' : '○ Pendiente'}</p></div>`,
      });
      marker.addListener('click', () => infoWindow.open(map, marker));
      return marker;
    });

    setMarkers(newMarkers);
    return () => newMarkers.forEach(m => m.setMap(null));
  }, [map, clientes]);

  // -------------------- CALCULAR RUTA AUTOMÁTICA --------------------
  const calcularRutaEnMapa = useCallback(() => {
    if (!map || !directionsRenderer || !window.google || ruta.length < 2) return;

    const waypoints = ruta.slice(1, -1).map(parada => {
      const cliente = clientes.find(c => c.id === parada.clienteId);
      return cliente ? { location: { lat: cliente.lat, lng: cliente.lng }, stopover: true } : null;
    }).filter(Boolean);

    const primerCliente = clientes.find(c => c.id === ruta[0].clienteId);
    const ultimoCliente = clientes.find(c => c.id === ruta[ruta.length - 1].clienteId);
    if (!primerCliente || !ultimoCliente) return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: { lat: primerCliente.lat, lng: primerCliente.lng },
      destination: { lat: ultimoCliente.lat, lng: ultimoCliente.lng },
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') directionsRenderer.setDirections(result);
      else console.error('Error calculando ruta:', status);
    });
  }, [map, directionsRenderer, ruta, clientes]);

  // Recalcular ruta cada vez que cambie la ruta
  useEffect(() => {
    if (ruta.length >= 2) calcularRutaEnMapa();
    else if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
  }, [ruta, calcularRutaEnMapa, directionsRenderer]);

  // -------------------- FUNCIONES AUXILIARES --------------------
  const calcularDistancia = (lat1, lng1, lat2, lng2) => {
    if (window.google?.maps?.geometry?.spherical) {
      const punto1 = new window.google.maps.LatLng(lat1, lng1);
      const punto2 = new window.google.maps.LatLng(lat2, lng2);
      return window.google.maps.geometry.spherical.computeDistanceBetween(punto1, punto2) / 1000;
    }
    // Fórmula Haversine
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada');
      return;
    }
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nuevaUbicacion = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUbicacionActual(nuevaUbicacion);
        if (map) {
          map.setCenter(nuevaUbicacion);
          map.setZoom(14);
          if (currentLocationMarkerRef.current) currentLocationMarkerRef.current.setMap(null);
          currentLocationMarkerRef.current = new window.google.maps.Marker({
            position: nuevaUbicacion,
            map,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3, scale: 8 },
            title: 'Tu ubicación',
          });
        }
        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error(error);
        alert('No se pudo obtener tu ubicación');
        setObteniendoUbicacion(false);
      }
    );
  };

  // Simular ubicación (para pruebas)
  const simularUbicacion = () => {
    // Usar la ubicación del primer cliente como simulación
    const clienteSimulado = clientes[0];
    if (!clienteSimulado) return;
    const ubicacionSimulada = { lat: clienteSimulado.lat, lng: clienteSimulado.lng };
    setUbicacionActual(ubicacionSimulada);
    if (map) {
      map.setCenter(ubicacionSimulada);
      map.setZoom(14);
      if (currentLocationMarkerRef.current) currentLocationMarkerRef.current.setMap(null);
      currentLocationMarkerRef.current = new window.google.maps.Marker({
        position: ubicacionSimulada,
        map,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3, scale: 8 },
        title: 'Ubicación simulada',
      });
    }
    alert(`Ubicación simulada establecida en: ${clienteSimulado.nombre}`);
  };

  const visitarCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    if (cliente.visitado) {
      alert('Este cliente ya fue visitado');
      return;
    }

    const origen = ubicacionActual || { lat: 19.4326, lng: -99.1332 };
    const distancia = calcularDistancia(origen.lat, origen.lng, cliente.lat, cliente.lng);

    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, visitado: true } : c));
    const nuevaRuta = [...ruta, {
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      distancia: distancia.toFixed(2),
      lat: cliente.lat,
      lng: cliente.lng,
    }];
    setRuta(nuevaRuta);
    setUbicacionActual({ lat: cliente.lat, lng: cliente.lng });
    setHistorial(prev => [{
      id: Date.now(),
      tipo: 'visita',
      cliente: cliente.nombre,
      hora: new Date().toLocaleString('es-MX'),
      detalles: `Visitado en ${cliente.direccion}`
    }, ...prev]);

    if (map) {
      map.panTo({ lat: cliente.lat, lng: cliente.lng });
      map.setZoom(15);
    }
  };

  const realizarCobro = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    if (!cliente.visitado) {
      alert('Primero debes visitar al cliente');
      return;
    }
    if (cliente.cobrado) {
      alert('Este cliente ya fue cobrado');
      return;
    }

    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, cobrado: true } : c));
    setTotalCobrado(prev => prev + cliente.montoFijo);
    setHistorial(prev => [{
      id: Date.now(),
      tipo: 'cobro',
      cliente: cliente.nombre,
      hora: new Date().toLocaleString('es-MX'),
      detalles: `Cobrado $${cliente.montoFijo.toFixed(2)}`
    }, ...prev]);
  };

  // Reiniciar día
  const reiniciarDia = () => {
    if (window.confirm('¿Reiniciar el día? Se perderán las visitas, cobros, ruta e historial. Los clientes se conservarán.')) {
      // Resetear estados de clientes
      setClientes(prev => prev.map(c => ({ ...c, visitado: false, cobrado: false })));
      setRuta([]);
      setHistorial([]);
      setTotalCobrado(0);
      // Limpiar marcador de ubicación actual pero no eliminar la ubicación almacenada (opcional)
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      alert('Día reiniciado correctamente');
    }
  };

  // Exportar datos (historial y ruta)
  const exportarDatos = () => {
    const datos = {
      fecha: new Date().toISOString(),
      totalCobrado,
      estadisticas: stats,
      ruta,
      historial,
    };
    const dataStr = JSON.stringify(datos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funeraria_datos_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    visitados: clientes.filter(c => c.visitado).length,
    cobrados: clientes.filter(c => c.cobrado).length,
    pendientes: clientes.filter(c => !c.visitado).length,
    totalPendiente: clientes.filter(c => c.visitado && !c.cobrado).reduce((sum, c) => sum + c.montoFijo, 0)
  }), [clientes]);

  // -------------------- COMPONENTES INTERNOS --------------------
  const MapaView = () => (
    <div className="space-y-3 pb-20">
      {!mapLoaded && GOOGLE_MAPS_API_KEY !== 'TU_API_KEY_AQUI' && (
        <div className="glass-effect p-8 rounded-xl text-center animate-pulse">
          <Map className="w-16 h-16 mx-auto mb-4 text-stone-400" />
          <p className="text-slate-300 font-semibold">Cargando Google Maps...</p>
        </div>
      )}
      {GOOGLE_MAPS_API_KEY === 'TU_API_KEY_AQUI' && (
        <div className="glass-effect p-6 rounded-xl border-2 border-amber-500/50 bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-amber-400 mb-2">Configura tu API Key</h3>
              <p className="text-slate-300 text-sm mb-3">Crea un archivo <code className="bg-slate-800 px-1 rounded">.env.local</code> con:</p>
              <pre className="bg-slate-900 p-3 rounded text-sm font-mono text-amber-300 mb-3 overflow-x-auto">REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui</pre>
              <p className="text-slate-300 text-sm">O reemplaza la constante <code className="bg-slate-800 px-1 rounded">GOOGLE_MAPS_API_KEY</code> en el código.</p>
            </div>
          </div>
        </div>
      )}
      {mapLoaded && GOOGLE_MAPS_API_KEY !== 'TU_API_KEY_AQUI' && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button onClick={obtenerUbicacionActual} disabled={obteniendoUbicacion} className={`flex-1 glass-effect py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${obteniendoUbicacion ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 active:scale-95'}`}>
              <Crosshair className={`w-4 h-4 ${obteniendoUbicacion ? 'animate-spin' : ''}`} /> {obteniendoUbicacion ? 'Obteniendo...' : 'Mi Ubicación'}
            </button>
            <button onClick={simularUbicacion} className="flex-1 glass-effect py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:bg-slate-700/50 active:scale-95 flex items-center justify-center gap-2">
              <Target className="w-4 h-4" /> Simular Ubicación
            </button>
            {ruta.length >= 2 && (
              <button onClick={calcularRutaEnMapa} className="flex-1 bg-gradient-to-r from-stone-600 to-stone-500 hover:from-stone-500 hover:to-stone-400 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                <Navigation className="w-4 h-4" /> Recalcular Ruta
              </button>
            )}
          </div>
          <div className="glass-effect p-2 rounded-xl overflow-hidden">
            <div ref={mapRef} className="w-full rounded-lg" style={{ height: '500px' }} />
          </div>
          <div className="glass-effect p-4 rounded-xl">
            <h3 className="font-bold text-sm text-slate-300 mb-3">Leyenda</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-stone-400 border-2 border-white"></div><span className="text-sm text-slate-400">Pendiente</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div><span className="text-sm text-slate-400">Visitado</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white"></div><span className="text-sm text-slate-400">Cobrado</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div><span className="text-sm text-slate-400">Tu ubicación</span></div>
            </div>
          </div>
          {!isOnline && (
            <div className="glass-effect p-3 rounded-xl bg-yellow-900/30 border border-yellow-600/50 text-yellow-300 text-sm flex items-center gap-2">
              <WifiOff className="w-4 h-4" /> Modo offline: El mapa puede no cargar correctamente, pero los datos locales funcionan.
            </div>
          )}
        </>
      )}
    </div>
  );

  const ClientesView = () => (
    <div className="space-y-3 pb-20">
      {clientes.map((cliente, idx) => (
        <div key={cliente.id} className="glass-effect p-4 rounded-xl card-hover gradient-border animate-slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-lg text-slate-100">{cliente.nombre}</h3>{cliente.cobrado && <CheckCircle className="w-5 h-5 text-green-400" />}</div>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2"><MapPin className="w-4 h-4" /><span>{cliente.direccion}</span></div>
              <div className="inline-block bg-slate-700/50 px-3 py-1 rounded-lg"><span className="text-stone-400 font-bold font-mono text-lg">${cliente.montoFijo.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="flex gap-2">
            {!cliente.visitado ? (
              <button onClick={() => visitarCliente(cliente.id)} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"> <Navigation className="w-4 h-4" /> Visitar </button>
            ) : !cliente.cobrado ? (
              <button onClick={() => realizarCobro(cliente.id)} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg pulse-glow"> <DollarSign className="w-4 h-4" /> Cobrar ${cliente.montoFijo.toFixed(2)} </button>
            ) : (
              <div className="flex-1 bg-slate-700/50 text-green-400 py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Completado</div>
            )}
          </div>
          {cliente.visitado && <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400"><Clock className="w-3 h-3" /><span>Visitado • {ruta.find(r => r.clienteId === cliente.id)?.hora || ''}</span></div>}
        </div>
      ))}
    </div>
  );

  const RutaView = () => (
    <div className="space-y-3 pb-20">
      {ruta.length === 0 ? (
        <div className="glass-effect p-8 rounded-xl text-center"><Map className="w-16 h-16 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay ruta generada aún</p><p className="text-sm text-slate-500 mt-2">Visita clientes para crear tu ruta automática</p></div>
      ) : (
        <>
          <div className="glass-effect p-4 rounded-xl mb-4 flex justify-between items-center"><div><h3 className="font-bold text-lg text-slate-100 mb-1">Ruta de Hoy</h3><p className="text-sm text-slate-400">{ruta.length} paradas realizadas</p></div><TrendingUp className="w-8 h-8 text-stone-400" /></div>
          {ruta.map((parada, idx) => (
            <div key={idx} className="glass-effect p-4 rounded-xl animate-slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-500 to-stone-400 flex items-center justify-center font-bold text-slate-900">{idx+1}</div>{idx < ruta.length-1 && <div className="w-0.5 h-12 bg-gradient-to-b from-stone-500 to-transparent mt-2" />}</div>
                <div className="flex-1"><h4 className="font-bold text-slate-100 mb-1">{parada.clienteNombre}</h4><div className="flex items-center gap-4 text-sm text-slate-400"><div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{parada.hora}</span></div><div className="flex items-center gap-1"><Navigation className="w-3 h-3" /><span>{parada.distancia} km</span></div></div></div>
              </div>
            </div>
          ))}
          <div className="glass-effect p-4 rounded-xl bg-gradient-to-r from-stone-900/30 to-stone-800/30 border border-stone-500/30"><div className="flex justify-between"><span className="text-slate-300 font-semibold">Distancia Total</span><span className="text-2xl font-bold text-stone-400 font-mono">{ruta.reduce((sum, p) => sum + parseFloat(p.distancia), 0).toFixed(2)} km</span></div></div>
        </>
      )}
    </div>
  );

  const HistorialView = () => (
    <div className="space-y-3 pb-20">
      <div className="flex justify-end mb-2">
        <button onClick={exportarDatos} className="glass-effect py-2 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-700/50 transition-all">
          <Download className="w-4 h-4" /> Exportar Datos
        </button>
      </div>
      {historial.length === 0 ? (
        <div className="glass-effect p-8 rounded-xl text-center"><Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" /><p className="text-slate-400">No hay actividad registrada</p><p className="text-sm text-slate-500 mt-2">Las visitas y cobros aparecerán aquí</p></div>
      ) : (
        historial.map((evento, idx) => (
          <div key={evento.id} className="glass-effect p-4 rounded-xl animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-start gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${evento.tipo === 'visita' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{evento.tipo === 'visita' ? <Navigation className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}</div><div className="flex-1"><div className="flex items-center justify-between mb-1"><h4 className="font-bold text-slate-100">{evento.cliente}</h4><span className={`text-xs font-mono px-2 py-1 rounded ${evento.tipo === 'visita' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{evento.tipo.toUpperCase()}</span></div><p className="text-sm text-slate-400 mb-1">{evento.detalles}</p><p className="text-xs text-slate-500 font-mono">{evento.hora}</p></div></div>
          </div>
        ))
      )}
    </div>
  );

  // -------------------- RENDER PRINCIPAL --------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); } 50% { box-shadow: 0 0 30px rgba(212, 175, 55, 0.5); } }
        .animate-slide-in { animation: slideInUp 0.4s ease-out forwards; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
        .glass-effect { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(148, 163, 184, 0.1); }
        .gradient-border { position: relative; background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(120, 100, 50, 0.1)); border: 2px solid transparent; }
        .gradient-border::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; padding: 2px; background: linear-gradient(135deg, #d4af37, #a0862c); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.3s; }
        .gradient-border:hover::before { opacity: 1; }
      `}</style>

      {/* Header */}
      <div className="glass-effect sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-stone-400 to-stone-300 bg-clip-text text-transparent">Funeraria Ruta</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Cobros y Visitas</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reiniciarDia} className="p-2 glass-effect rounded-lg hover:bg-slate-700/50 transition-all" title="Reiniciar día">
              <RotateCcw className="w-5 h-5 text-stone-400" />
            </button>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-mono">Total Cobrado</p>
              <p className="text-lg font-bold text-green-400 font-mono">${totalCobrado.toFixed(2)}</p>
            </div>
          </div>
        </div>
        {/* Indicador de conexión */}
        <div className="max-w-md mx-auto px-4 pb-2 text-right">
          {isOnline ? (
            <div className="inline-flex items-center gap-1 text-xs text-green-400"><Wifi className="w-3 h-3" /> En línea</div>
          ) : (
            <div className="inline-flex items-center gap-1 text-xs text-yellow-400"><WifiOff className="w-3 h-3" /> Sin conexión</div>
          )}
        </div>
      </div>

      {/* Stats & Tabs */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="glass-effect p-3 rounded-xl text-center"><div className="text-2xl font-bold text-stone-400 font-mono">{stats.visitados}</div><div className="text-xs text-slate-400 mt-1">Visitados</div></div>
          <div className="glass-effect p-3 rounded-xl text-center"><div className="text-2xl font-bold text-green-400 font-mono">{stats.cobrados}</div><div className="text-xs text-slate-400 mt-1">Cobrados</div></div>
          <div className="glass-effect p-3 rounded-xl text-center"><div className="text-2xl font-bold text-blue-400 font-mono">{stats.pendientes}</div><div className="text-xs text-slate-400 mt-1">Pendientes</div></div>
          <div className="glass-effect p-3 rounded-xl text-center"><div className="text-2xl font-bold text-stone-400 font-mono">{clientes.length}</div><div className="text-xs text-slate-400 mt-1">Total</div></div>
        </div>

        <div className="glass-effect p-1 rounded-xl mb-4 flex gap-1">
          {['mapa', 'clientes', 'ruta', 'historial'].map(tab => (
            <button key={tab} onClick={() => setVistaActiva(tab)} className={`flex-1 py-3 px-3 rounded-lg font-semibold text-sm transition-all ${vistaActiva === tab ? 'bg-gradient-to-r from-stone-600 to-stone-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              {tab === 'mapa' && <Map className="w-4 h-4 inline mr-1" />}
              {tab === 'clientes' && <User className="w-4 h-4 inline mr-1" />}
              {tab === 'ruta' && <Navigation className="w-4 h-4 inline mr-1" />}
              {tab === 'historial' && <Activity className="w-4 h-4 inline mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {vistaActiva === 'mapa' && <MapaView />}
        {vistaActiva === 'clientes' && <ClientesView />}
        {vistaActiva === 'ruta' && <RutaView />}
        {vistaActiva === 'historial' && <HistorialView />}
      </div>

      {stats.totalPendiente > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-slate-700/50 py-4 shadow-2xl">
          <div className="max-w-md mx-auto px-4 flex justify-between items-center">
            <div><p className="text-xs text-slate-400 mb-1">Pendiente de Cobro</p><p className="text-2xl font-bold text-stone-400 font-mono">${stats.totalPendiente.toFixed(2)}</p></div>
            <div className="text-right"><p className="text-xs text-slate-400 mb-1">Clientes por Cobrar</p><p className="text-2xl font-bold text-stone-400 font-mono">{stats.visitados - stats.cobrados}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}