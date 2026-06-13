import React, { useState, useEffect, useRef } from 'react';
import { Users, Activity, Trophy, UserPlus, PlayCircle, Hash, Award, TrendingUp } from 'lucide-react';

// --- Komponen Latar Belakang WebGL (Shader Murni) ---
const WebGLBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.error('WebGL tidak didukung');
      return;
    }

    // Vertex Shader: Menggambar kotak layar penuh
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Efek Plasma/Neon Dinamis
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        // Normalisasi koordinat piksel (dari -1 ke 1)
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= u_resolution.x / u_resolution.y;

        // Warna dasar (Ungu gelap ke biru)
        vec3 color = vec3(0.05, 0.05, 0.1);

        // Membuat gelombang pergerakan
        for(float i = 1.0; i < 4.0; i++){
            uv.x += 0.6 / i * cos(i * 2.5 * uv.y + u_time * 0.5);
            uv.y += 0.6 / i * cos(i * 1.5 * uv.x + u_time * 0.5);
        }
        
        // Intensitas cahaya
        float glow = 0.5 / abs(sin(u_time * 0.2 + uv.y + uv.x));
        
        // Palet warna neon (Pink kemerahan & Biru Cyan)
        vec3 neonColor = vec3(
            0.5 * sin(u_time * 0.3) + 0.5, // R
            0.2,                           // G
            0.5 * cos(u_time * 0.2) + 0.8  // B
        );

        color += neonColor * glow * 0.15;
        
        // Vignette (menggelapkan pinggiran)
        float dist = length(gl_FragCoord.xy / u_resolution.xy - 0.5);
        color *= smoothstep(0.8, 0.2, dist);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Fungsi utilitas kompilasi shader
    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Setup buffer untuk layar penuh
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    // Loop Animasi
    let animationFrameId;
    const render = (time) => {
      time *= 0.001; // Konversi ke detik

      // Resize canvas agar sesuai jendela
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-900"
    />
  );
};

// --- Komponen UI Utama ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State untuk Registrasi
  const [formData, setFormData] = useState({ name: '', email: '', username: '' });
  const [registered, setRegistered] = useState(false);

  // Data Mock Dasbor
  const metrics = [
    { title: 'Total Member', value: '1,248', icon: Users, color: 'text-blue-400' },
    { title: 'Permainan Aktif', value: '12', icon: Activity, color: 'text-green-400' },
    { title: 'Bingo Hari Ini', value: '86', icon: Trophy, color: 'text-yellow-400' },
    { title: 'Rata-rata Skor', value: '4.2k', icon: TrendingUp, color: 'text-purple-400' },
  ];

  const topMembers = [
    { id: 1, name: 'Budi Santoso', score: 15420, winRate: '68%', tier: 'Diamond' },
    { id: 2, name: 'Siti Aminah', score: 14200, winRate: '62%', tier: 'Platinum' },
    { id: 3, name: 'Alex Wijaya', score: 12850, winRate: '55%', tier: 'Gold' },
    { id: 4, name: 'Dewi Lestari', score: 11900, winRate: '51%', tier: 'Gold' },
  ];

  // Data Mock Permainan Langsung
  const [liveNumber, setLiveNumber] = useState('B-12');
  const [calledNumbers, setCalledNumbers] = useState(['B-5', 'I-24', 'N-32', 'G-55', 'O-70', 'B-12']);
  
  // Simulasi pemanggilan nomor baru secara acak
  useEffect(() => {
    if (activeTab !== 'live') return;
    const interval = setInterval(() => {
      const letters = ['B', 'I', 'N', 'G', 'O'];
      const ranges = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };
      const l = letters[Math.floor(Math.random() * letters.length)];
      const n = Math.floor(Math.random() * (ranges[l][1] - ranges[l][0] + 1)) + ranges[l][0];
      const newNum = `${l}-${n}`;
      
      setLiveNumber(newNum);
      setCalledNumbers(prev => [...new Set([...prev, newNum])]);
    }, 4000); // Ganti nomor setiap 4 detik
    return () => clearInterval(interval);
  }, [activeTab]);


  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Activity className="mr-3 text-cyan-400" /> Metrik Performa
            </h2>
            
            {/* Kartu Metrik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((m, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-300 font-medium">{m.title}</h3>
                    <m.icon className={`w-6 h-6 ${m.color}`} />
                  </div>
                  <p className="text-4xl font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Papan Peringkat Anggota */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden mt-8">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Award className="mr-2 text-yellow-400" /> Top Member Bulan Ini
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                  <thead className="bg-black/20 text-gray-400">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-lg">Peringkat</th>
                      <th className="px-6 py-4">Nama Anggota</th>
                      <th className="px-6 py-4">Total Skor</th>
                      <th className="px-6 py-4">Win Rate</th>
                      <th className="px-6 py-4 rounded-tr-lg">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topMembers.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                        <td className="px-6 py-4 text-cyan-300">{member.score.toLocaleString()}</td>
                        <td className="px-6 py-4">{member.winRate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.tier === 'Diamond' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' :
                            member.tier === 'Platinum' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                          }`}>
                            {member.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'live':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <PlayCircle className="mr-3 text-red-500 animate-pulse" /> Papan Skor Langsung
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tampilan Nomor Utama */}
              <div className="lg:col-span-1 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
                <h3 className="text-gray-300 font-medium mb-4 uppercase tracking-widest text-sm">Nomor Terpanggil</h3>
                <div className="w-48 h-48 bg-black/40 rounded-full flex items-center justify-center border-4 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] mb-4 transition-all transform scale-100 animate-bounce-subtle">
                  <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-300 drop-shadow-lg">
                    {liveNumber}
                  </span>
                </div>
                <p className="text-cyan-400 animate-pulse">Menunggu nomor berikutnya...</p>
              </div>

              {/* Papan Riwayat Nomor (Bingo Board) */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center border-b border-white/10 pb-4">
                  <Hash className="mr-2 text-pink-400" /> Riwayat Nomor
                </h3>
                <div className="grid grid-cols-5 gap-2 sm:gap-4">
                  {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                    <div key={letter} className="flex flex-col gap-2">
                      <div className="bg-pink-500/80 text-white font-bold text-center py-2 rounded-lg text-xl shadow-lg">
                        {letter}
                      </div>
                      {/* Membuat simulasi slot nomor 1-5 untuk tiap huruf untuk tampilan */}
                      {[1, 2, 3, 4, 5].map((rowIdx) => {
                         // Ini hanya simulasi visual grid acak
                         const isCalled = Math.random() > 0.7; 
                         return (
                           <div key={rowIdx} className={`h-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-300 ${
                             isCalled 
                              ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105 border border-cyan-300' 
                              : 'bg-black/30 text-gray-500 border border-white/5'
                           }`}>
                             {isCalled ? '✓' : '·'}
                           </div>
                         )
                      })}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                   <span className="text-sm text-gray-400 w-full mb-2">Urutan Panggilan:</span>
                   {calledNumbers.slice(-10).map((num, i) => (
                     <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                       {num}
                     </span>
                   ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="flex justify-center items-center animate-fadeIn py-10">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl"></div>
              
              <div className="text-center mb-8 relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Gabung Klub</h2>
                <p className="text-gray-400 mt-2">Daftar sekarang dan mainkan Bingo!</p>
              </div>

              {registered ? (
                <div className="text-center p-6 bg-green-500/20 border border-green-500/50 rounded-xl relative z-10">
                  <Award className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Pendaftaran Berhasil!</h3>
                  <p className="text-gray-300">Selamat datang, {formData.name}. Bersiaplah untuk mendapatkan BINGO pertama Anda.</p>
                  <button 
                    onClick={() => { setRegistered(false); setFormData({name:'', email:'', username:''}); setActiveTab('dashboard'); }}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  >
                    Ke Dasbor
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => { e.preventDefault(); setRegistered(true); }} 
                  className="space-y-5 relative z-10"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nama Lengkap</label>
                    <input 
                      required type="text" 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="Masukkan nama Anda"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                      required type="email" 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="email@contoh.com"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Username Pemain</label>
                    <input 
                      required type="text" 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="Nickname unik Anda"
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all"
                  >
                    Daftar Sekarang
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-slate-100 relative">
      {/* Background WebGL Shader yang diminta */}
      <WebGLBackground />
      
      {/* Konten Lapisan Atas */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigasi Atas */}
        <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  NEON<span className="text-cyan-400">BINGO</span>
                </span>
              </div>
              
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-2">
                  {[
                    { id: 'dashboard', label: 'Dasbor', icon: Activity },
                    { id: 'live', label: 'Skor Langsung', icon: PlayCircle },
                    { id: 'register', label: 'Pendaftaran', icon: UserPlus },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-white/10 text-cyan-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 mr-2 ${activeTab === item.id ? 'text-cyan-400' : ''}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Mobile Sederhana */}
              <div className="md:hidden flex space-x-2">
                 {['dashboard', 'live', 'register'].map((tab) => (
                   <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`p-2 rounded-lg ${activeTab === tab ? 'bg-white/10 text-cyan-400' : 'text-gray-400'}`}
                    >
                      {tab === 'dashboard' && <Activity size={20} />}
                      {tab === 'live' && <PlayCircle size={20} />}
                      {tab === 'register' && <UserPlus size={20} />}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Area Konten Utama */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {renderTabContent()}
        </main>
        
        {/* Footer Sederhana */}
        <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md py-6 text-center text-sm text-gray-500">
          <p>© 2026 Neon Bingo Club. Dirancang dengan WebGL Shader.</p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}