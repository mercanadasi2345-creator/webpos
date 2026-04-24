// ═══════════════════════════════════════════════════════════════
//  BÜFE KASA — Firebase + Auth + Masalar + Gerçek Zamanlı Sync
//  Firebase config'i aşağıdaki FIREBASE_CONFIG nesnesine girin
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

// ─── FIREBASE CONFIG — KENDİ BİLGİLERİNİZLE DEĞİŞTİRİN ───────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj3VAqQuU_8BCoYWN3dl_XeUG1jJFl_ws",
  authDomain: "olimpiyat-kasa.firebaseapp.com",
  projectId: "olimpiyat-kasa",
  storageBucket: "olimpiyat-kasa.firebasestorage.app",
  messagingSenderId: "672591997535",
  appId: "1:672591997535:web:d62b1aa7aa266b120f89ea",
  measurementId: "G-DLYL617LNF"
};
// ──────────────────────────────────────────────────────────────

// Firebase SDK — CDN'den yükleniyor (index.html'e ekleyin):
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>

// ── Firebase başlatma (global window.firebase kullanımı) ──────
let db = null;
let auth = null;
function initFirebase() {
  try {
    if (!window.firebase) return false;
    if (!window.firebase.apps?.length) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = window.firebase.firestore();
    auth = window.firebase.auth();
    return true;
  } catch (e) {
    console.error("Firebase init hatası:", e);
    return false;
  }
}

// ── Varsayılan ürünler ────────────────────────────────────────
const VARSAYILAN_URUNLER = [
  { id: "u1", ad: "Yarım Döner", fiyat: 80, emoji: "🌯", kategori: "Döner", aktif: true, sira: 0 },
  { id: "u2", ad: "Tam Döner", fiyat: 150, emoji: "🌯", kategori: "Döner", aktif: true, sira: 1 },
  { id: "u3", ad: "Döner Tabak", fiyat: 180, emoji: "🍽️", kategori: "Döner", aktif: true, sira: 2 },
  { id: "u4", ad: "Ekmek Arası", fiyat: 60, emoji: "🥙", kategori: "Döner", aktif: true, sira: 3 },
  { id: "u5", ad: "Dürüm", fiyat: 100, emoji: "🌮", kategori: "Döner", aktif: true, sira: 4 },
  { id: "u6", ad: "Kaşarlı Döner", fiyat: 120, emoji: "🧀", kategori: "Döner", aktif: true, sira: 5 },
  { id: "u7", ad: "Tavuk Döner", fiyat: 75, emoji: "🍗", kategori: "Döner", aktif: true, sira: 6 },
  { id: "u8", ad: "Piyaz", fiyat: 30, emoji: "🥗", kategori: "Yan Ürün", aktif: true, sira: 7 },
  { id: "u9", ad: "Cacık", fiyat: 25, emoji: "🥣", kategori: "Yan Ürün", aktif: true, sira: 8 },
  { id: "u10", ad: "Pilav", fiyat: 40, emoji: "🍚", kategori: "Yan Ürün", aktif: true, sira: 9 },
  { id: "u11", ad: "Patates Kızartma", fiyat: 50, emoji: "🍟", kategori: "Yan Ürün", aktif: true, sira: 10 },
  { id: "u12", ad: "Çorba", fiyat: 45, emoji: "🍜", kategori: "Yan Ürün", aktif: true, sira: 11 },
  { id: "u13", ad: "Su", fiyat: 10, emoji: "💧", kategori: "İçecek", aktif: true, sira: 12 },
  { id: "u14", ad: "Ayran", fiyat: 20, emoji: "🥛", kategori: "İçecek", aktif: true, sira: 13 },
  { id: "u15", ad: "Kola", fiyat: 35, emoji: "🥤", kategori: "İçecek", aktif: true, sira: 14 },
  { id: "u16", ad: "Çay", fiyat: 15, emoji: "🍵", kategori: "İçecek", aktif: true, sira: 15 },
  { id: "u17", ad: "Ayran Büyük", fiyat: 30, emoji: "🥛", kategori: "İçecek", aktif: true, sira: 16 },
  { id: "u18", ad: "Baklava", fiyat: 60, emoji: "🍮", kategori: "Tatlı", aktif: true, sira: 17 },
  { id: "u19", ad: "Sütlaç", fiyat: 50, emoji: "🍮", kategori: "Tatlı", aktif: true, sira: 18 },
  { id: "u20", ad: "Sigara Böreği", fiyat: 15, emoji: "🥐", kategori: "Atıştırmalık", aktif: true, sira: 19 },
];

const EMOJILER = ["🌯","🍽️","🥙","🌮","🧀","🍗","🥩","🥗","🥣","🍚","🍟","🍜","💧","🥛","🥤","🍵","☕","🧃","🍊","🍋","🍮","🧇","🍦","🥐","🥯","🫧","🌶️","🔥","⭐","🍕","🍔","🌽","🥦","🫙","🧂"];

// ── Renk paleti ────────────────────────────────────────────────
const S = {
  bg: "#0f0a04", panel: "#1a1208", kart: "#231808", border: "#5a3a14",
  altin: "#FFD700", turuncu: "#FF6B35", yesil: "#22c55e", kirmizi: "#ef4444",
  metin: "#f5e6c8", soluk: "#8a7060", mavi: "#3b82f6", mor: "#8b5cf6",
};

// ── Responsive hook ────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

// ── Bildirim bileşeni ──────────────────────────────────────────
function Bildirim({ bildirim }) {
  if (!bildirim) return null;
  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      background: bildirim.renk || "#1a6b1a", color: "#fff",
      padding: "10px 22px", borderRadius: 8, zIndex: 9999,
      fontSize: 13, fontWeight: "bold", boxShadow: "0 4px 20px #0008",
      whiteSpace: "nowrap", pointerEvents: "none",
      animation: "slideDown 0.2s ease",
    }}>
      {bildirim.msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GİRİŞ EKRANI
// ═══════════════════════════════════════════════════════════════
function GirisEkrani({ onLogin }) {
  const [mod, setMod] = useState("giris"); // giris | kayit
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap() {
    if (!email || !sifre) { setHata("Email ve şifre zorunlu"); return; }
    setYukleniyor(true); setHata("");
    try {
      const kred = await auth.signInWithEmailAndPassword(email, sifre);
      const snap = await db.collection("kullanicilar").doc(kred.user.uid).get();
      onLogin({ uid: kred.user.uid, email, ad: snap.data()?.ad || email });
    } catch (e) {
      setHata(e.code === "auth/user-not-found" ? "Kullanıcı bulunamadı" :
              e.code === "auth/wrong-password" ? "Yanlış şifre" : e.message);
    }
    setYukleniyor(false);
  }

  async function kayitOl() {
    if (!ad || !email || !sifre) { setHata("Tüm alanlar zorunlu"); return; }
    if (sifre.length < 6) { setHata("Şifre en az 6 karakter olmalı"); return; }
    setYukleniyor(true); setHata("");
    try {
      const kred = await auth.createUserWithEmailAndPassword(email, sifre);
      await db.collection("kullanicilar").doc(kred.user.uid).set({ ad, email, olusturma: new Date() });
      // İlk kullanıcıysa varsayılan ürün ve masaları oluştur
      await ilkKurulumuYap(kred.user.uid);
      onLogin({ uid: kred.user.uid, email, ad });
    } catch (e) {
      setHata(e.code === "auth/email-already-in-use" ? "Bu email zaten kayıtlı" : e.message);
    }
    setYukleniyor(false);
  }

  async function ilkKurulumuYap(uid) {
    // Masalar zaten var mı kontrol et
    const masaSnap = await db.collection("masalar").limit(1).get();
    if (!masaSnap.empty) return;
    const batch = db.batch();
    for (let i = 1; i <= 10; i++) {
      const ref = db.collection("masalar").doc(`masa_${i}`);
      batch.set(ref, { ad: `Masa ${i}`, sira: i - 1, olusturan: uid, aktif: true });
    }
    for (const u of VARSAYILAN_URUNLER) {
      const ref = db.collection("urunler").doc(u.id);
      batch.set(ref, { ...u, olusturan: uid });
    }
    await batch.commit();
  }

  const inp = {
    width: "100%", padding: "12px 14px", background: S.kart,
    border: "1px solid " + S.border, borderRadius: 8,
    color: S.metin, fontSize: 14, boxSizing: "border-box",
    outline: "none", fontFamily: "'Courier New', monospace",
  };

  return (
    <div style={{
      minHeight: "100vh", background: S.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace", padding: 16,
    }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: #5a4030; }
        input:focus { border-color: #FF6B35 !important; }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 380,
        background: S.panel, border: "2px solid " + S.border,
        borderRadius: 16, padding: 28, boxShadow: "0 20px 60px #00000088",
        animation: "fadeIn 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: S.altin, letterSpacing: 3 }}>BÜFE KASA</div>
          <div style={{ fontSize: 11, color: S.soluk, marginTop: 4 }}>Yönetim Sistemi</div>
        </div>

        {/* Tab */}
        <div style={{ display: "flex", gap: 4, marginBottom: 22, background: S.kart, borderRadius: 10, padding: 4 }}>
          {["giris", "kayit"].map(t => (
            <button key={t} onClick={() => { setMod(t); setHata(""); }} style={{
              flex: 1, padding: "9px 0", borderRadius: 7, border: "none",
              background: mod === t ? S.turuncu : "transparent",
              color: mod === t ? "#fff" : S.soluk, cursor: "pointer",
              fontSize: 13, fontWeight: "bold",
              fontFamily: "'Courier New', monospace",
            }}>
              {t === "giris" ? "🔑 GİRİŞ" : "📝 KAYIT"}
            </button>
          ))}
        </div>

        {mod === "kayit" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: S.soluk, marginBottom: 5 }}>Ad Soyad</div>
            <input style={inp} placeholder="Ad Soyad" value={ad} onChange={e => setAd(e.target.value)} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: S.soluk, marginBottom: 5 }}>E-posta</div>
          <input style={inp} type="email" placeholder="ornek@mail.com" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mod === "giris" ? girisYap() : kayitOl())} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: S.soluk, marginBottom: 5 }}>Şifre</div>
          <input style={inp} type="password" placeholder="••••••" value={sifre} onChange={e => setSifre(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mod === "giris" ? girisYap() : kayitOl())} />
        </div>

        {hata && <div style={{ background: "#2a0a0a", border: "1px solid #7a2a2a", borderRadius: 7, padding: "9px 12px", marginBottom: 14, fontSize: 12, color: S.kirmizi }}>{hata}</div>}

        <button
          onClick={mod === "giris" ? girisYap : kayitOl}
          disabled={yukleniyor}
          style={{
            width: "100%", padding: "13px", background: yukleniyor ? "#2a1a08" : "#8B1A1A",
            color: yukleniyor ? S.soluk : S.altin, border: "1px solid #cc3333",
            borderRadius: 8, fontSize: 15, fontWeight: "bold", cursor: yukleniyor ? "default" : "pointer",
            letterSpacing: 2, fontFamily: "'Courier New', monospace",
          }}
        >
          {yukleniyor ? "⏳ BEKLENIYOR..." : mod === "giris" ? "🔑 GİRİŞ YAP" : "📝 HESAP OLUŞTUR"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANA SAYFA — MASALAR
// ═══════════════════════════════════════════════════════════════
function MasalarEkrani({ kullanici, onCikis, onMasaSec }) {
  const [masalar, setMasalar] = useState([]);
  const [duzenleId, setDuzenleId] = useState(null);
  const [duzenleAd, setDuzenleAd] = useState("");
  const [yeniAd, setYeniAd] = useState("");
  const [masaEkleAcik, setMasaEkleAcik] = useState(false);
  const [bildirim, setBildirim] = useState(null);
  const [masaSepetler, setMasaSepetler] = useState({});
  const isMobile = useIsMobile();

  function bildirimGoster(msg, renk = "#1a6b1a") {
    setBildirim({ msg, renk });
    setTimeout(() => setBildirim(null), 2200);
  }

  // Masaları dinle
  useEffect(() => {
    const unsub = db.collection("masalar").orderBy("sira").onSnapshot(snap => {
      setMasalar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Masaların sepet özetlerini dinle
  useEffect(() => {
    const unsubs = [];
    masalar.forEach(m => {
      const unsub = db.collection("masalar").doc(m.id).collection("sepet").onSnapshot(snap => {
        const items = snap.docs.map(d => d.data());
        const toplam = items.reduce((a, i) => a + (i.fiyat * i.adet), 0);
        setMasaSepetler(prev => ({ ...prev, [m.id]: { items, toplam, adet: items.length } }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, [masalar.length]);

  async function masaEkle() {
    if (!yeniAd.trim()) return;
    const sira = masalar.length;
    await db.collection("masalar").add({ ad: yeniAd.trim(), sira, aktif: true, olusturan: kullanici.uid });
    setYeniAd(""); setMasaEkleAcik(false);
    bildirimGoster(`✅ ${yeniAd} oluşturuldu`);
  }

  async function masaGuncelle(id) {
    if (!duzenleAd.trim()) return;
    await db.collection("masalar").doc(id).update({ ad: duzenleAd.trim() });
    setDuzenleId(null);
    bildirimGoster("✅ Masa adı güncellendi");
  }

  async function masaSil(id, ad) {
    if (!window.confirm(`"${ad}" silinsin mi?`)) return;
    await db.collection("masalar").doc(id).delete();
    bildirimGoster("🗑 Masa silindi", "#8B1A1A");
  }

  const cols = isMobile ? 2 : 4;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.metin, fontFamily: "'Courier New', monospace" }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .masa-kart:hover { border-color: #FF6B35 !important; transform: translateY(-2px); }
        .masa-kart { transition: all 0.15s ease; }
      `}</style>
      <Bildirim bildirim={bildirim} />

      {/* Header */}
      <div style={{ background: "#8B1A1A", padding: isMobile ? "12px 14px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + S.turuncu }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: "bold", color: S.altin, letterSpacing: 2 }}>BÜFE KASA</div>
            <div style={{ fontSize: 10, color: "#ffaa88" }}>Hoş geldin, {kullanici.ad}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMasaEkleAcik(true)} style={{ background: "#1a5a1a", border: "1px solid #2a7a2a", borderRadius: 7, color: "#aaffaa", padding: isMobile ? "7px 10px" : "8px 14px", cursor: "pointer", fontSize: isMobile ? 11 : 13, fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>+ MASA</button>
          <button onClick={onCikis} style={{ background: "#2a0808", border: "1px solid #5a1a1a", borderRadius: 7, color: "#ff8888", padding: isMobile ? "7px 10px" : "8px 14px", cursor: "pointer", fontSize: isMobile ? 11 : 13, fontFamily: "'Courier New', monospace" }}>⏏ ÇIKIŞ</button>
        </div>
      </div>

      {/* Masa Ekle Modal */}
      {masaEkleAcik && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: S.panel, border: "2px solid " + S.border, borderRadius: 12, padding: 24, width: 320, animation: "fadeIn 0.2s ease" }}>
            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>➕ Yeni Masa</div>
            <input value={yeniAd} onChange={e => setYeniAd(e.target.value)} placeholder="Masa adı..."
              onKeyDown={e => e.key === "Enter" && masaEkle()}
              style={{ width: "100%", padding: "11px 12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 7, color: S.metin, fontSize: 14, boxSizing: "border-box", fontFamily: "'Courier New', monospace", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => setMasaEkleAcik(false)} style={{ flex: 1, padding: "10px", background: S.kart, border: "1px solid " + S.border, borderRadius: 7, color: S.soluk, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>İPTAL</button>
              <button onClick={masaEkle} style={{ flex: 2, padding: "10px", background: "#1a5a1a", color: "#aaffaa", border: "none", borderRadius: 7, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>✅ EKLE</button>
            </div>
          </div>
        </div>
      )}

      {/* Masalar Grid */}
      <div style={{ padding: isMobile ? 12 : 24, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 10 : 16 }}>
        {masalar.map(masa => {
          const sep = masaSepetler[masa.id] || { toplam: 0, adet: 0 };
          const dolu = sep.adet > 0;
          return (
            <div key={masa.id} className="masa-kart" style={{
              background: dolu ? "#1a0a0a" : S.kart,
              border: `2px solid ${dolu ? S.turuncu : S.border}`,
              borderRadius: 12, padding: isMobile ? 12 : 18,
              boxShadow: dolu ? "0 0 16px #FF6B3533" : "none",
              animation: "fadeIn 0.3s ease",
            }}>
              {duzenleId === masa.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={duzenleAd} onChange={e => setDuzenleAd(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") masaGuncelle(masa.id); if (e.key === "Escape") setDuzenleId(null); }}
                    autoFocus
                    style={{ flex: 1, padding: "6px 8px", background: S.bg, border: "1px solid " + S.turuncu, borderRadius: 5, color: S.metin, fontSize: 12, fontFamily: "'Courier New', monospace", outline: "none" }} />
                  <button onClick={() => masaGuncelle(masa.id)} style={{ background: "#1a5a1a", border: "none", borderRadius: 5, color: "#aaffaa", padding: "6px 8px", cursor: "pointer", fontSize: 12 }}>✓</button>
                  <button onClick={() => setDuzenleId(null)} style={{ background: "#2a0a0a", border: "none", borderRadius: 5, color: "#ff8888", padding: "6px 8px", cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <button onClick={() => onMasaSec(masa)} style={{ background: "none", border: "none", color: S.metin, cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "'Courier New', monospace", flex: 1 }}>
                      <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: "bold", marginBottom: 2 }}>{masa.ad}</div>
                      {dolu ? (
                        <div style={{ fontSize: 11, color: S.altin, fontWeight: "bold" }}>{sep.toplam}₺ · {sep.adet} kalem</div>
                      ) : (
                        <div style={{ fontSize: 10, color: S.soluk }}>Boş</div>
                      )}
                    </button>
                    <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                      <button onClick={() => { setDuzenleId(masa.id); setDuzenleAd(masa.ad); }} style={{ background: "#1a1a3a", border: "1px solid #3a3a7a", borderRadius: 5, color: "#8888ff", padding: "4px 6px", cursor: "pointer", fontSize: 10 }}>✏️</button>
                      <button onClick={() => masaSil(masa.id, masa.ad)} style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 5, color: S.kirmizi, padding: "4px 6px", cursor: "pointer", fontSize: 10 }}>🗑</button>
                    </div>
                  </div>
                  <button onClick={() => onMasaSec(masa)} style={{
                    width: "100%", padding: isMobile ? "8px" : "10px", borderRadius: 7, border: "none",
                    background: dolu ? "#FF6B35" : "#2a1808",
                    color: dolu ? "#fff" : S.soluk,
                    fontWeight: "bold", cursor: "pointer", fontSize: isMobile ? 11 : 13,
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {dolu ? "👁 GÖRÜNTÜLE" : "🍽️ AÇ"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  FİŞ YAZDIR
// ═══════════════════════════════════════════════════════════════
function fisYazdir(masa, sepet, toplam, kullanici) {
  const w = window.open("", "_blank", "width=320,height=600");
  const zaman = new Date().toLocaleString("tr-TR");
  const satirlar = sepet.map(i =>
    `<tr><td>${i.ad}</td><td style="text-align:center">${i.adet}</td><td style="text-align:right">${i.adet * i.fiyat}₺</td></tr>`
  ).join("");
  w.document.write(`
    <html><head><title>Fiş</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .big { font-size: 16px; }
      hr { border: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; }
      .toplam { font-size: 15px; font-weight: bold; }
      @media print { body { width: 80mm; } }
    </style>
    </head><body>
    <div class="center bold big">🔥 BÜFE KASA</div>
    <div class="center">${masa.ad}</div>
    <div class="center" style="font-size:10px">${zaman}</div>
    <div style="font-size:10px">Kasiyer: ${kullanici.ad}</div>
    <hr>
    <table>
      <thead><tr><th style="text-align:left">Ürün</th><th>Adet</th><th style="text-align:right">Tutar</th></tr></thead>
      <tbody>${satirlar}</tbody>
    </table>
    <hr>
    <div class="center toplam">TOPLAM: ${toplam}₺</div>
    <hr>
    <div class="center" style="font-size:10px; margin-top:8px">Teşekkürler! Afiyet olsun.</div>
    </body></html>
  `);
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 400);
}

// ═══════════════════════════════════════════════════════════════
//  KASA EKRANI (masa bazlı)
// ═══════════════════════════════════════════════════════════════
function KasaEkrani({ masa, kullanici, onGeri }) {
  const [urunler, setUrunler] = useState([]);
  const [sepet, setSepet] = useState([]);
  const [aktifKategori, setAktifKategori] = useState("Tümü");
  const [kasaArama, setKasaArama] = useState("");
  const [adetInput, setAdetInput] = useState("");
  const [seciliUrun, setSeciliUrun] = useState(null);
  const [odemeGosterge, setOdemeGosterge] = useState(false);
  const [alinan, setAlinan] = useState("");
  const [bildirim, setBildirim] = useState(null);
  const [ekran, setEkran] = useState("kasa"); // kasa | ayarlar
  const [ayarEkran, setAyarEkran] = useState("menu");
  const [duzenleUrun, setDuzenleUrun] = useState(null);
  const [yeniUrun, setYeniUrun] = useState({ ad: "", fiyat: "", emoji: "🌯", kategori: "Döner" });
  const [topluOran, setTopluOran] = useState("");
  const [topluKategori, setTopluKategori] = useState("Tümü");
  const [aramaMetni, setAramaMetni] = useState("");
  const [emojiSecici, setEmojiSecici] = useState(false);
  const [tekliDuzenle, setTekliDuzenle] = useState({});
  const [siralama, setSiralama] = useState(false);
  const [surukleIdx, setSurukleIdx] = useState(null);
  const [satisSayaci, setSatisSayaci] = useState({ gunluk: 0, toplam: 0, adet: 0 });
  const kasaAramaRef = useRef();
  const isMobile = useIsMobile();

  function bildirimGoster(msg, renk = "#1a6b1a") {
    setBildirim({ msg, renk });
    setTimeout(() => setBildirim(null), 2200);
  }

  // Ürünleri Firebase'den dinle
  useEffect(() => {
    const unsub = db.collection("urunler").orderBy("sira").onSnapshot(snap => {
      setUrunler(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Masanın sepetini Firebase'den dinle
  useEffect(() => {
    const unsub = db.collection("masalar").doc(masa.id).collection("sepet")
      .onSnapshot(snap => {
        setSepet(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
      });
    return () => unsub();
  }, [masa.id]);

  // Satış sayacı
  useEffect(() => {
    const unsub = db.collection("istatistik").doc("genel").onSnapshot(snap => {
      if (snap.exists) setSatisSayaci(snap.data());
    });
    return () => unsub();
  }, []);

  const kategoriler = ["Tümü", ...new Set(urunler.map(u => u.kategori))];
  const filtreliUrunler = urunler.filter(u => {
    if (!u.aktif) return false;
    if (kasaArama.trim()) return u.ad.toLowerCase().includes(kasaArama.toLowerCase());
    return aktifKategori === "Tümü" || u.kategori === aktifKategori;
  });
  const toplam = sepet.reduce((a, i) => a + i.fiyat * i.adet, 0);
  const para = alinan ? parseFloat(alinan) : 0;
  const ustu = para - toplam;

  function urunSec(urun) {
    if (seciliUrun?.id === urun.id) { adetTus("✓"); return; }
    setSeciliUrun(urun); setAdetInput("1");
  }

  async function adetTus(tus) {
    if (tus === "C") { setAdetInput(""); setSeciliUrun(null); return; }
    if (tus === "⌫") { setAdetInput(p => p.slice(0, -1)); return; }
    if (tus === "✓") {
      if (!seciliUrun || !adetInput || parseInt(adetInput) <= 0) return;
      const adet = parseInt(adetInput);
      const mevcutDoc = sepet.find(i => i.id === seciliUrun.id);
      if (mevcutDoc) {
        await db.collection("masalar").doc(masa.id).collection("sepet").doc(mevcutDoc._docId)
          .update({ adet: mevcutDoc.adet + adet, sonEkleyen: kullanici.ad, guncelleme: new Date() });
      } else {
        await db.collection("masalar").doc(masa.id).collection("sepet").add({
          id: seciliUrun.id, ad: seciliUrun.ad, fiyat: seciliUrun.fiyat,
          emoji: seciliUrun.emoji, adet, ekleyen: kullanici.ad, eklemeZamani: new Date(),
        });
      }
      bildirimGoster(`✓ ${seciliUrun.ad} x${adet} eklendi`);
      setSeciliUrun(null); setAdetInput(""); return;
    }
    setAdetInput(p => (p + tus).replace(/^0+(\d)/, "$1"));
  }

  async function sepettenCikar(docId) {
    await db.collection("masalar").doc(masa.id).collection("sepet").doc(docId).delete();
  }

  async function adetDegistir(item, delta) {
    const yeniAdet = Math.max(1, item.adet + delta);
    await db.collection("masalar").doc(masa.id).collection("sepet").doc(item._docId)
      .update({ adet: yeniAdet, sonEkleyen: kullanici.ad, guncelleme: new Date() });
  }

  async function temizle() {
    const batch = db.batch();
    sepet.forEach(i => {
      batch.delete(db.collection("masalar").doc(masa.id).collection("sepet").doc(i._docId));
    });
    await batch.commit();
    setOdemeGosterge(false); setAlinan("");
  }

  async function tahsilEt() {
    if (ustu < 0 || !alinan || sepet.length === 0) return;
    // Satış kaydı
    await db.collection("satislar").add({
      masaId: masa.id, masaAd: masa.ad, kasiyer: kullanici.ad,
      uid: kullanici.uid, toplam, sepet, tarih: new Date(),
    });
    // İstatistik güncelle
    await db.collection("istatistik").doc("genel").set({
      gunluk: (satisSayaci.gunluk || 0) + toplam,
      toplam: (satisSayaci.toplam || 0) + toplam,
      adet: (satisSayaci.adet || 0) + 1,
    }, { merge: true });
    bildirimGoster(`✅ ${toplam}₺ tahsil edildi! Üstü: ${ustu}₺`);
    await temizle();
  }

  // ── Ürün yönetimi ─────────────────────────────────────────────
  async function urunEkle() {
    if (!yeniUrun.ad || !yeniUrun.fiyat) { bildirimGoster("Ad ve fiyat zorunlu!", "#8B1A1A"); return; }
    const sira = urunler.length;
    await db.collection("urunler").add({ ...yeniUrun, fiyat: parseFloat(yeniUrun.fiyat), aktif: true, sira, olusturan: kullanici.ad });
    setYeniUrun({ ad: "", fiyat: "", emoji: "🌯", kategori: "Döner" });
    bildirimGoster(`✅ ${yeniUrun.ad} eklendi!`);
    setAyarEkran("urunler");
  }

  async function urunGuncelle() {
    await db.collection("urunler").doc(duzenleUrun.id).update({ ...duzenleUrun, fiyat: parseFloat(duzenleUrun.fiyat) });
    bildirimGoster(`✅ ${duzenleUrun.ad} güncellendi!`);
    setAyarEkran("urunler"); setDuzenleUrun(null);
  }

  async function urunSil(id) {
    await db.collection("urunler").doc(id).delete();
    bildirimGoster("🗑 Ürün silindi", "#8B1A1A");
  }

  async function urunToggle(u) {
    await db.collection("urunler").doc(u.id).update({ aktif: !u.aktif });
  }

  async function topluFiyatGuncelle(tip) {
    if (!topluOran) return;
    const oran = parseFloat(topluOran);
    const batch = db.batch();
    urunler.filter(u => topluKategori === "Tümü" || u.kategori === topluKategori).forEach(u => {
      const yeniFiyat = tip === "artir" ? u.fiyat * (1 + oran / 100) : u.fiyat * (1 - oran / 100);
      batch.update(db.collection("urunler").doc(u.id), { fiyat: Math.round(yeniFiyat) });
    });
    await batch.commit();
    bildirimGoster(`✅ Fiyatlar ${tip === "artir" ? "%" + oran + " artırıldı" : "%" + oran + " indirildi"}!`);
    setTopluOran("");
  }

  // Tekli fiyat güncelleme
  async function tekFiyatKaydet(urun) {
    const yeniFiyat = parseFloat(tekliDuzenle[urun.id]);
    if (isNaN(yeniFiyat) || yeniFiyat <= 0) { bildirimGoster("Geçersiz fiyat!", "#8B1A1A"); return; }
    await db.collection("urunler").doc(urun.id).update({ fiyat: yeniFiyat });
    setTekliDuzenle(p => { const k = { ...p }; delete k[urun.id]; return k; });
    bildirimGoster(`✅ ${urun.ad} → ${yeniFiyat}₺`);
  }

  // Sıralama - drag
  function surukleBasla(idx) { setSurukleIdx(idx); }
  function surukleUzeri(idx) {
    if (surukleIdx === null || surukleIdx === idx) return;
    const yeni = [...urunler];
    const [alindi] = yeni.splice(surukleIdx, 1);
    yeni.splice(idx, 0, alindi);
    setSurukleIdx(idx);
    // Yerel state güncelle (gerçek kayıt için kaydet butonuna basılacak)
    setUrunler(yeni);
  }
  async function siralamayiKaydet() {
    const batch = db.batch();
    urunler.forEach((u, i) => { batch.update(db.collection("urunler").doc(u.id), { sira: i }); });
    await batch.commit();
    setSiralama(false);
    bildirimGoster("✅ Sıralama kaydedildi!");
  }

    const newLocal = "100%";
  // ── KASA EKRANI ─────────────────────────────────────────────
  if (ekran === "kasa") return (
    <div style={{
      background: S.bg, minHeight: "100vh", color: S.metin,
      fontFamily: "'Courier New', monospace",
      display: "flex", flexDirection: isMobile ? "column" : "row",
      maxWidth: isMobile ? 480 : "100%", margin: "0 auto",
    }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        input::placeholder { color: #5a4030; }
        .urun-btn:active { transform: scale(0.95); }
        .urun-btn { transition: all 0.1s ease; }
      `}</style>
      <Bildirim bildirim={bildirim} />

      {/* DESKTOP: Yan panel */}
      {!isMobile && (
        <div style={{ width: 280, background: "#0d0800", borderRight: "2px solid " + S.border, display: "flex", flexDirection: "column" }}>
          {/* Sepet */}
          <div style={{ padding: "14px 14px 6px", borderBottom: "1px solid " + S.border }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: "bold", color: S.altin }}>🛒 {masa.ad}</span>
              <button onClick={onGeri} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 12 }}>← Masalar</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {sepet.length === 0 && <div style={{ color: S.soluk, fontSize: 12, textAlign: "center", marginTop: 20 }}>Sepet boş</div>}
            {sepet.map(item => (
              <div key={item._docId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid #2a1a08" }}>
                <span style={{ fontSize: 14 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: "bold" }}>{item.ad}</div>
                  <div style={{ fontSize: 9, color: S.soluk }}>{item.ekleyen}</div>
                </div>
                <button onClick={() => adetDegistir(item, -1)} style={{ background: "#2a0a0a", border: "none", color: S.kirmizi, cursor: "pointer", fontSize: 14, width: 22, height: 22, borderRadius: 4 }}>−</button>
                <span style={{ fontSize: 12, color: S.altin, minWidth: 16, textAlign: "center" }}>{item.adet}</span>
                <button onClick={() => adetDegistir(item, 1)} style={{ background: "#0a2a0a", border: "none", color: S.yesil, cursor: "pointer", fontSize: 14, width: 22, height: 22, borderRadius: 4 }}>+</button>
                <span style={{ fontSize: 11, color: S.altin, minWidth: 45, textAlign: "right" }}>{item.adet * item.fiyat}₺</span>
                <button onClick={() => sepettenCikar(item._docId)} style={{ background: "none", border: "none", color: "#663333", cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>
            ))}
          </div>
          {/* Ödeme paneli */}
          <div style={{ padding: "12px 14px", borderTop: "2px solid " + S.border }}>
            {!odemeGosterge ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: S.soluk }}>TOPLAM</span>
                  <span style={{ fontSize: 24, fontWeight: "bold", color: S.altin }}>{toplam}₺</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => fisYazdir(masa, sepet, toplam, kullanici)} style={{ padding: "9px 10px", background: "#1a1a3a", color: "#8888ff", border: "1px solid #3a3a7a", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "'Courier New', monospace" }}>🖨️</button>
                  <button onClick={temizle} style={{ padding: "9px 10px", background: "#2a0000", color: "#ff8888", border: "1px solid #550000", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🗑</button>
                  <button onClick={() => sepet.length > 0 && setOdemeGosterge(true)} style={{ flex: 1, padding: "9px 0", background: sepet.length > 0 ? "#1a5a1a" : "#1a2a0a", color: sepet.length > 0 ? "#aaffaa" : "#4a6a4a", border: "1px solid #2a7a2a", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>💳 ÖDEME</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: S.soluk, marginBottom: 6 }}>Alınan Para:</div>
                <input type="number" value={alinan} onChange={e => setAlinan(e.target.value)} placeholder="0"
                  style={{ width: "100%", padding: "8px", fontSize: 18, fontWeight: "bold", background: S.bg, border: "1px solid " + S.border, borderRadius: 6, color: S.altin, textAlign: "right", boxSizing: "border-box", fontFamily: "'Courier New', monospace", outline: "none" }} />
                {alinan && (
                  <div style={{ background: ustu >= 0 ? "#0a2a0a" : "#2a0a0a", border: "1px solid " + (ustu >= 0 ? "#2a7a2a" : "#7a2a2a"), borderRadius: 6, padding: "6px 10px", margin: "8px 0", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: S.soluk }}>ÜSTÜ:</span>
                    <span style={{ fontSize: 18, fontWeight: "bold", color: ustu >= 0 ? S.yesil : S.kirmizi }}>{ustu >= 0 ? ustu + "₺" : "YETERSİZ"}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button onClick={() => setOdemeGosterge(false)} style={{ flex: 1, padding: "9px 0", background: S.kart, color: S.soluk, border: "1px solid " + S.border, borderRadius: 6, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>← GERİ</button>
                  <button onClick={tahsilEt} disabled={ustu < 0 || !alinan} style={{ flex: 2, padding: "9px 0", fontWeight: "bold", background: ustu >= 0 && alinan ? "#1a5a1a" : "#1a2a0a", color: ustu >= 0 && alinan ? "#aaffaa" : "#4a6a4a", border: "1px solid #2a7a2a", borderRadius: 6, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>✓ TAHSİL ET</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

     <div style={{ flex: 1, display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100vh", overflow: "hidden" }}>
  {/* Header — Sabit */}
  <div style={{ background: "#8B1A1A", padding: isMobile ? "10px 12px" : "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid " + S.turuncu, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {isMobile && <button onClick={onGeri} style={{ background: "none", border: "none", color: "#ffaa88", cursor: "pointer", fontSize: 18 }}>←</button>}
      <span style={{ fontSize: 20 }}>🔥</span>
      <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: "bold", color: S.altin, letterSpacing: 2 }}>{masa.ad.toUpperCase()}</span>
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 10, color: "#ffaa88" }}>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
      {!isMobile && <button onClick={onGeri} style={{ background: "#5a1010", border: "1px solid #ff6b35", borderRadius: 6, color: S.altin, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "'Courier New', monospace" }}>← Masalar</button>}
      <button onClick={() => { setEkran("ayarlar"); setAyarEkran("menu"); }} style={{ background: "#5a1010", border: "1px solid #ff6b35", borderRadius: 6, color: S.altin, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}>⚙️</button>
    </div>
  </div>

  {/* Arama ve Kategori — Sabit */}
  <div style={{ flexShrink: 0 }}>
    <div style={{ padding: "8px 10px", background: "#130c04", borderBottom: "1px solid " + S.border }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 10, fontSize: 14, color: S.soluk, pointerEvents: "none" }}>🔍</span>
        <input ref={kasaAramaRef} type="text" value={kasaArama}
          onChange={e => { setKasaArama(e.target.value); if (e.target.value) setAktifKategori("Tümü"); }}
          placeholder="Ürün ara..."
          style={{ width: "100%", padding: "8px 32px 8px 32px", background: "#1c1208", border: "1px solid " + (kasaArama ? S.turuncu : S.border), borderRadius: 8, color: S.metin, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Courier New', monospace" }} />
        {kasaArama && <button onClick={() => setKasaArama("")} style={{ position: "absolute", right: 8, background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 15 }}>✕</button>}
      </div>
    </div>

    {!kasaArama.trim() && (
      <div style={{ display: "flex", gap: 4, padding: "6px 8px", background: "#150e04", overflowX: "auto", borderBottom: "1px solid " + S.border }}>
        {kategoriler.map(k => (
          <button key={k} onClick={() => setAktifKategori(k)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap", background: aktifKategori === k ? S.turuncu : S.kart, color: aktifKategori === k ? "#fff" : S.soluk, border: "1px solid " + (aktifKategori === k ? S.turuncu : S.border), borderRadius: 20, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>{k}</button>
        ))}
      </div>
    )}
  </div>

  {/* Numpad — Sabit */}
  {seciliUrun && (
    <div style={{ background: "#1a0a0a", borderBottom: "2px solid " + S.turuncu, padding: "8px 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 26 }}>{seciliUrun.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>{seciliUrun.ad}</div>
          <div style={{ fontSize: 11, color: S.soluk }}>{seciliUrun.fiyat}₺ × {adetInput || "?"} = <span style={{ color: S.altin }}>{adetInput ? parseInt(adetInput) * seciliUrun.fiyat : 0}₺</span></div>
        </div>
        <div style={{ fontSize: 26, fontWeight: "bold", color: S.altin }}>{adetInput || "–"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
        {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(t => (
          <button key={t} onClick={() => adetTus(t)} style={{ padding: "10px 0", fontSize: 14, fontWeight: "bold", background: t === "C" ? "#4a0000" : t === "⌫" ? "#2a1500" : "#2a1a08", color: t === "C" ? "#ff8888" : t === "⌫" ? "#ffaa66" : S.metin, border: "1px solid " + S.border, borderRadius: 5, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>{t}</button>
        ))}
      </div>
      <button onClick={() => adetTus("✓")} style={{ width: "100%", marginTop: 6, padding: "11px", fontSize: 14, fontWeight: "bold", background: "#1a5a1a", color: "#aaffaa", border: "1px solid #2a8a2a", borderRadius: 6, cursor: "pointer", letterSpacing: 1, fontFamily: "'Courier New', monospace" }}>✓ SEPETE EKLE</button>
    </div>
  )}

  {/* Ürün Grid — KAYDIRILABİLİR ALAN */}
  <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: 6, alignContent: "start" }}>
    {filtreliUrunler.length === 0 && kasaArama.trim() && (
      <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "32px 0", color: S.soluk }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
        <div style={{ fontSize: 13 }}>"{kasaArama}" bulunamadı</div>
      </div>
    )}
    {filtreliUrunler.map(urun => (
      <button key={urun.id} className="urun-btn" onClick={() => urunSec(urun)} 
        style={{ 
          background: seciliUrun?.id === urun.id ? "#3a0a0a" : S.kart, 
          border: "2px solid " + (seciliUrun?.id === urun.id ? S.turuncu : S.border), 
          borderRadius: 8, padding: "8px 4px", textAlign: "center", color: S.metin, height: "fit-content"
        }}>
        {urun.resim ? (
            <img src={urun.resim} style={{ width: "100%", height: 50, objectFit: "cover", borderRadius: 4, marginBottom: 4 }} alt={urun.ad} />
        ) : (
            <div style={{ fontSize: 26, marginBottom: 2 }}>{urun.emoji}</div>
        )}
        <div style={{ fontSize: 10, fontWeight: "bold", lineHeight: 1.2 }}>{urun.ad}</div>
        <div style={{ fontSize: 11, color: S.altin }}>{urun.fiyat}₺</div>
      </button>
    ))}
  </div>

  {/* Mobil Alt Sepet — Sabit */}
  {isMobile && (
    <div style={{ background: "#0d0800", borderTop: "2px solid " + S.border, padding: "10px 12px", flexShrink: 0 }}>
      {sepet.length > 0 && !odemeGosterge && (
        <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 8, borderBottom: "1px solid #2a1a08" }}>
          {sepet.map(item => (
            <div key={item._docId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: "1px solid #2a1a08" }}>
              <span style={{ fontSize: 13 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}><span style={{ fontSize: 11 }}>{item.ad}</span></div>
              <button onClick={() => adetDegistir(item, -1)} style={{ background: "#2a0a0a", border: "none", color: S.kirmizi, width: 20, height: 20, borderRadius: 4 }}>−</button>
              <span style={{ fontSize: 11, color: S.altin, minWidth: 14, textAlign: "center" }}>{item.adet}</span>
              <button onClick={() => adetDegistir(item, 1)} style={{ background: "#0a2a0a", border: "none", color: S.yesil, width: 20, height: 20, borderRadius: 4 }}>+</button>
              <span style={{ fontSize: 11, color: S.altin, minWidth: 42, textAlign: "right" }}>{item.adet * item.fiyat}₺</span>
            </div>
          ))}
        </div>
      )}
            {!odemeGosterge ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: S.soluk }}>TOPLAM</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: S.altin }}>{toplam}₺</div>
                </div>
                <button onClick={() => fisYazdir(masa, sepet, toplam, kullanici)} style={{ padding: "10px 11px", background: "#1a1a3a", color: "#8888ff", border: "1px solid #3a3a7a", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>🖨️</button>
                <button onClick={temizle} style={{ padding: "10px 11px", background: "#2a0000", color: "#ff8888", border: "1px solid #550000", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🗑</button>
                <button onClick={() => sepet.length > 0 && setOdemeGosterge(true)} style={{ padding: "10px 18px", background: sepet.length > 0 ? "#1a5a1a" : "#1a2a0a", color: sepet.length > 0 ? "#aaffaa" : "#4a6a4a", border: "1px solid #2a7a2a", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>💳 ÖDEME</button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: S.soluk, fontSize: 12 }}>TOPLAM:</span>
                  <span style={{ color: S.altin, fontSize: 20, fontWeight: "bold" }}>{toplam}₺</span>
                </div>
                <input type="number" value={alinan} onChange={e => setAlinan(e.target.value)} placeholder="Alınan para..."
                  style={{ width: "100%", padding: "9px", fontSize: 18, fontWeight: "bold", background: "#0d0800", border: "1px solid " + S.border, borderRadius: 6, color: S.altin, textAlign: "right", boxSizing: "border-box", fontFamily: "'Courier New', monospace", outline: "none" }} />
                {alinan && (
                  <div style={{ background: ustu >= 0 ? "#0a2a0a" : "#2a0a0a", border: "1px solid " + (ustu >= 0 ? "#2a7a2a" : "#7a2a2a"), borderRadius: 6, padding: "6px 10px", margin: "6px 0", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: S.soluk }}>ÜSTÜ:</span>
                    <span style={{ fontSize: 20, fontWeight: "bold", color: ustu >= 0 ? S.yesil : S.kirmizi }}>{ustu >= 0 ? ustu + "₺" : "YETERSİZ"}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={() => setOdemeGosterge(false)} style={{ flex: 1, padding: "10px 0", background: S.kart, color: S.soluk, border: "1px solid " + S.border, borderRadius: 6, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>← GERİ</button>
                  <button onClick={tahsilEt} disabled={ustu < 0 || !alinan} style={{ flex: 2, padding: "10px 0", fontWeight: "bold", fontSize: 13, background: ustu >= 0 && alinan ? "#1a5a1a" : "#1a2a0a", color: ustu >= 0 && alinan ? "#aaffaa" : "#4a6a4a", border: "1px solid #2a7a2a", borderRadius: 6, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>✓ TAHSİL ET</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── AYARLAR EKRANI ───────────────────────────────────────────
  if (ekran === "ayarlar") return (
    <div style={{ background: S.bg, minHeight: "100vh", color: S.metin, fontFamily: "'Courier New', monospace", maxWidth: isMobile ? 480 : 720, margin: "0 auto" }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        input::placeholder { color: #5a4030; }
        input:focus { border-color: #FF6B35 !important; }
        .drag-item { cursor: grab; user-select: none; }
        .drag-item:active { cursor: grabbing; }
      `}</style>
      <Bildirim bildirim={bildirim} />

      <div style={{ background: "#1a0a30", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid #7b35ff" }}>
        <button onClick={() => { setEkran("kasa"); setAyarEkran("menu"); }} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontSize: 16, fontWeight: "bold", color: "#c0a0ff", letterSpacing: 1 }}>⚙️ AYARLAR</span>
      </div>

      {ayarEkran === "menu" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Günlük Ciro", val: (satisSayaci.gunluk || 0) + "₺", ico: "📈" },
              { label: "Toplam İşlem", val: (satisSayaci.adet || 0) + " adet", ico: "🧾" },
              { label: "Toplam Ciro", val: (satisSayaci.toplam || 0) + "₺", ico: "💰" },
              { label: "Aktif Ürün", val: urunler.filter(u => u.aktif).length + " adet", ico: "📦" },
            ].map(s => (
              <div key={s.label} style={{ background: S.kart, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 18 }}>{s.ico}</div>
                <div style={{ fontSize: 10, color: S.soluk }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: "bold", color: S.altin }}>{s.val}</div>
              </div>
            ))}
          </div>
          {[
            { ico: "➕", label: "Yeni Ürün Ekle", desc: "Menüye yeni ürün ekle", tik: () => { setYeniUrun({ ad: "", fiyat: "", emoji: "🌯", kategori: "Döner" }); setAyarEkran("urunEkle"); } },
            { ico: "📋", label: "Ürünleri Yönet", desc: urunler.length + " ürün · düzenle, sil, aktif/pasif", tik: () => setAyarEkran("urunler") },
            { ico: "💹", label: "Toplu Fiyat Güncelle", desc: "Yüzde zam / indirim", tik: () => setAyarEkran("topluFiyat") },
            { ico: "✏️", label: "Tekli Fiyat Güncelle", desc: "Her ürünün fiyatını tek tek gir", tik: () => setAyarEkran("tekliFiyat") },
            { ico: "↕️", label: "Ürün Sıralaması", desc: "Sürükle-bırak ile sırala", tik: () => { setAyarEkran("siralama"); setSiralama(true); } },
          ].map(m => (
            <button key={m.label} onClick={m.tik} style={{ background: S.kart, border: "1px solid " + S.border, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", color: S.metin, textAlign: "left", width: "100%", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>
              <span style={{ fontSize: 22 }}>{m.ico}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: S.soluk }}>{m.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: S.soluk }}>›</span>
            </button>
          ))}
        </div>
      )}

     {/* Ürün Ekle — Cloudinary Destekli */}
{ayarEkran === "urunEkle" && (
  <div style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <button onClick={() => setAyarEkran("menu")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 20 }}>←</button>
      <span style={{ fontSize: 14, fontWeight: "bold" }}>➕ Yeni Ürün Ekle</span>
    </div>

    {/* Resim / Emoji Önizleme Alanı */}
    <div style={{ textAlign: "center", marginBottom: 16 }}>
      <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto" }}>
        <div 
          onClick={() => !yeniUrun.resim && setEmojiSecici(!emojiSecici)}
          style={{ 
            width: "100%", height: "100%", borderRadius: 16, 
            border: "2px dashed " + (yeniUrun.resim ? S.yesil : S.border), 
            display: "flex", alignItems: "center", justifyContent: "center", 
            background: S.kart, overflow: "hidden", cursor: "pointer" 
          }}
        >
          {yeniUrun.resim ? (
            <img src={yeniUrun.resim} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Önizleme" />
          ) : (
            <span style={{ fontSize: 40 }}>{yeniUrun.emoji}</span>
          )}
        </div>
        
        {/* Resim Yükleme İkonu (Dosya Seçici) */}
        <label style={{ 
          position: "absolute", bottom: -5, right: -5, background: S.turuncu, 
          width: 30, height: 30, borderRadius: "50%", display: "flex", 
          alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid " + S.bg 
        }}>
          <span style={{ fontSize: 16 }}>📷</span>
          <input 
            type="file" 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              
              // Yükleniyor efekti için geçici bildirim
              bildirimGoster("⌛ Resim yükleniyor...", S.mavi);
              
             const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "webpos"); // Az önce oluşturduğun preset
            
            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/daolkrc0r/image/upload", {
                method: "POST",
                body: formData
              });
              const data = await res.json();
              
              if (data.secure_url) {
                setYeniUrun(p => ({ ...p, resim: data.secure_url }));
                bildirimGoster("✅ Resim yüklendi!", "#22c55e");
              } else {
                console.error("Yükleme hatası:", data);
                bildirimGoster("❌ Resim yüklenemedi", "#ef4444");
              }
            } catch (err) {
              console.error("Fetch hatası:", err);
              bildirimGoster("❌ Sunucu hatası!", "#ef4444");
            }
          />
        </label>
        
        {/* Resmi Kaldır Butonu */}
        {yeniUrun.resim && (
          <button 
            onClick={() => setYeniUrun(p => ({ ...p, resim: null }))}
            style={{ position: "absolute", top: -5, right: -5, background: S.kirmizi, border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 10, cursor: "pointer" }}
          >✕</button>
        )}
      </div>
      <div style={{ fontSize: 10, color: S.soluk, marginTop: 8 }}>{yeniUrun.resim ? "Resim yüklendi" : "Emoji seç veya resim yükle"}</div>
    </div>

    {/* Emoji Seçici Panel */}
    {emojiSecici && !yeniUrun.resim && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: S.panel, border: "1px solid " + S.border, borderRadius: 10, padding: 10, marginBottom: 16, maxHeight: 120, overflowY: "auto" }}>
        {EMOJILER.map(e => (
          <button key={e} onClick={() => { setYeniUrun(p => ({ ...p, emoji: e })); setEmojiSecici(false); }} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", padding: 4 }}>{e}</button>
        ))}
      </div>
    )}

    {/* Giriş Alanları */}
    {[{ label: "Ürün Adı *", key: "ad", type: "text", ph: "Örn: Arnavut Ciğeri" }, { label: "Fiyat (₺) *", key: "fiyat", type: "number", ph: "0.00" }].map(f => (
      <div key={f.key} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: S.soluk, marginBottom: 5 }}>{f.label}</div>
        <input 
          type={f.type} 
          placeholder={f.ph}
          value={yeniUrun[f.key]} 
          onChange={e => setYeniUrun(p => ({ ...p, [f.key]: e.target.value }))}
          style={{ width: "100%", padding: "12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 8, color: S.metin, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "'Courier New', monospace" }} 
        />
      </div>
    ))}

    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: S.soluk, marginBottom: 5 }}>Kategori:</div>
      <select 
        value={yeniUrun.kategori} 
        onChange={e => setYeniUrun(p => ({ ...p, kategori: e.target.value }))}
        style={{ width: "100%", padding: "12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 8, color: S.metin, fontSize: 14, fontFamily: "'Courier New', monospace", outline: "none" }}
      >
        {[...new Set(urunler.map(u => u.kategori))].map(k => <option key={k} value={k}>{k}</option>)}
        <option value="__yeni__">+ Yeni Kategori Oluştur</option>
      </select>
      
      {yeniUrun.kategori === "__yeni__" && (
        <input 
          type="text" 
          autoFocus
          placeholder="Kategori adını girin..." 
          onChange={e => setYeniUrun(p => ({ ...p, kategori: e.target.value }))}
          style={{ width: "100%", marginTop: 8, padding: "12px", background: S.kart, border: "1px solid " + S.turuncu, borderRadius: 8, color: S.metin, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "'Courier New', monospace" }} 
        />
      )}
    </div>

    <button 
      onClick={urunEkle} 
      style={{ width: "100%", padding: "15px", background: "#1a5a1a", color: "#aaffaa", border: "1px solid #2a7a2a", borderRadius: 10, fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}
    >
      ✅ ÜRÜNÜ KAYDET
    </button>
  </div>
)}

      {/* Ürün Listesi */}
      {ayarEkran === "urunler" && (
        <div style={{ padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <button onClick={() => setAyarEkran("menu")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, fontWeight: "bold", flex: 1 }}>📋 Ürün Yönetimi</span>
            <button onClick={() => setAyarEkran("urunEkle")} style={{ background: S.turuncu, border: "none", borderRadius: 6, color: "#fff", padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>+ EKLE</button>
          </div>
          <input type="text" placeholder="🔍 Ürün ara..." value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 8, color: S.metin, fontSize: 13, boxSizing: "border-box", marginBottom: 10, outline: "none", fontFamily: "'Courier New', monospace" }} />
          {urunler.filter(u => u.ad.toLowerCase().includes(aramaMetni.toLowerCase())).map(u => (
            <div key={u.id} style={{ background: S.kart, border: "1px solid " + (u.aktif ? S.border : "#3a2a1a"), borderRadius: 8, padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10, opacity: u.aktif ? 1 : 0.5 }}>
              <span style={{ fontSize: 22 }}>{u.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{u.ad}</div>
                <div style={{ fontSize: 10, color: S.soluk }}>{u.kategori} · <span style={{ color: S.altin }}>{u.fiyat}₺</span></div>
              </div>
              <button onClick={() => urunToggle(u)} style={{ background: u.aktif ? "#0a2a0a" : "#2a1a08", border: "1px solid " + (u.aktif ? "#2a7a2a" : S.border), borderRadius: 5, color: u.aktif ? S.yesil : S.soluk, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>{u.aktif ? "✓" : "✗"}</button>
              <button onClick={() => { setDuzenleUrun({ ...u }); setAyarEkran("urunDuzenle"); }} style={{ background: "#1a1a3a", border: "1px solid #3a3a7a", borderRadius: 5, color: "#8888ff", padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>✏️</button>
              <button onClick={() => urunSil(u.id)} style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 5, color: S.kirmizi, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Ürün Düzenle */}
      {ayarEkran === "urunDuzenle" && duzenleUrun && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setAyarEkran("urunler")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, fontWeight: "bold" }}>✏️ Ürün Düzenle</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, background: S.kart, border: "1px solid " + S.border, borderRadius: 8, padding: 8, maxHeight: 110, overflowY: "auto", marginBottom: 12 }}>
            {EMOJILER.map(e => (
              <button key={e} onClick={() => setDuzenleUrun(p => ({ ...p, emoji: e }))} style={{ fontSize: 20, background: duzenleUrun.emoji === e ? "#3a2a00" : "none", border: duzenleUrun.emoji === e ? "1px solid " + S.altin : "none", borderRadius: 4, cursor: "pointer", padding: 3 }}>{e}</button>
            ))}
          </div>
          {[{ label: "Ürün Adı", key: "ad", type: "text" }, { label: "Fiyat (₺)", key: "fiyat", type: "number" }].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: S.soluk, marginBottom: 4 }}>{f.label}:</div>
              <input type={f.type} value={duzenleUrun[f.key]} onChange={e => setDuzenleUrun(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 6, color: S.metin, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "'Courier New', monospace" }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.soluk, marginBottom: 4 }}>Kategori:</div>
            <select value={duzenleUrun.kategori} onChange={e => setDuzenleUrun(p => ({ ...p, kategori: e.target.value }))}
              style={{ width: "100%", padding: "10px", background: S.kart, border: "1px solid " + S.border, borderRadius: 6, color: S.metin, fontSize: 14, fontFamily: "'Courier New', monospace" }}>
              {[...new Set(urunler.map(u => u.kategori))].map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setAyarEkran("urunler")} style={{ flex: 1, padding: "12px", background: S.kart, color: S.soluk, border: "1px solid " + S.border, borderRadius: 8, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>İPTAL</button>
            <button onClick={urunGuncelle} style={{ flex: 2, padding: "12px", background: "#1a4a8a", color: "#aaccff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>💾 KAYDET</button>
          </div>
        </div>
      )}

      {/* Toplu Fiyat */}
      {ayarEkran === "topluFiyat" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setAyarEkran("menu")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, fontWeight: "bold" }}>💹 Toplu Fiyat Güncelle</span>
          </div>
          <div style={{ background: S.kart, border: "1px solid " + S.border, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.soluk, marginBottom: 8 }}>Kategori:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Tümü", ...new Set(urunler.map(u => u.kategori))].map(k => (
                <button key={k} onClick={() => setTopluKategori(k)} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", background: topluKategori === k ? S.turuncu : S.panel, color: topluKategori === k ? "#fff" : S.soluk, border: "1px solid " + (topluKategori === k ? S.turuncu : S.border), fontFamily: "'Courier New', monospace" }}>{k}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.soluk, marginBottom: 6 }}>Yüzde (%):</div>
            <input type="number" value={topluOran} onChange={e => setTopluOran(e.target.value)} placeholder="örn: 10"
              style={{ width: "100%", padding: "12px", background: S.kart, border: "1px solid " + S.border, borderRadius: 8, color: S.metin, fontSize: 18, fontWeight: "bold", textAlign: "center", boxSizing: "border-box", outline: "none", fontFamily: "'Courier New', monospace" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => topluFiyatGuncelle("artir")} style={{ flex: 1, padding: "14px 0", background: "#1a4a1a", color: "#aaffaa", border: "1px solid #2a7a2a", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>📈 %{topluOran || "?"} ZAM</button>
            <button onClick={() => topluFiyatGuncelle("indir")} style={{ flex: 1, padding: "14px 0", background: "#3a1a1a", color: "#ffaaaa", border: "1px solid #7a2a2a", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>📉 %{topluOran || "?"} İNDİRİM</button>
          </div>
          {topluOran && (
            <div style={{ background: S.kart, border: "1px solid " + S.border, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11, color: S.soluk, marginBottom: 6 }}>Önizleme:</div>
              {urunler.filter(u => topluKategori === "Tümü" || u.kategori === topluKategori).slice(0, 5).map(u => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0", borderBottom: "1px solid #2a1a08" }}>
                  <span>{u.ad}</span>
                  <span>{u.fiyat}₺ → <span style={{ color: S.altin }}>{Math.round(u.fiyat * (1 + parseFloat(topluOran) / 100))}₺</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tekli Fiyat Güncelle */}
      {ayarEkran === "tekliFiyat" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setAyarEkran("menu")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, fontWeight: "bold" }}>✏️ Tekli Fiyat Güncelle</span>
          </div>
          <div style={{ fontSize: 11, color: S.soluk, marginBottom: 12 }}>Değiştirmek istediğin ürünün fiyatını yaz ve ✓ ile kaydet.</div>
          {urunler.map(u => (
            <div key={u.id} style={{ background: S.kart, border: "1px solid " + S.border, borderRadius: 8, padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{u.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{u.ad}</div>
                <div style={{ fontSize: 10, color: S.soluk }}>{u.kategori} · Mevcut: <span style={{ color: S.altin }}>{u.fiyat}₺</span></div>
              </div>
              <input
                type="number"
                placeholder={u.fiyat + ""}
                value={tekliDuzenle[u.id] !== undefined ? tekliDuzenle[u.id] : ""}
                onChange={e => setTekliDuzenle(p => ({ ...p, [u.id]: e.target.value }))}
                style={{ width: 72, padding: "7px 8px", background: S.bg, border: "1px solid " + (tekliDuzenle[u.id] !== undefined ? S.turuncu : S.border), borderRadius: 6, color: S.altin, fontSize: 13, fontWeight: "bold", textAlign: "right", outline: "none", fontFamily: "'Courier New', monospace" }}
              />
              <span style={{ fontSize: 12, color: S.soluk }}>₺</span>
              {tekliDuzenle[u.id] !== undefined && tekliDuzenle[u.id] !== "" && (
                <button onClick={() => tekFiyatKaydet(u)} style={{ background: "#1a5a1a", border: "1px solid #2a7a2a", borderRadius: 6, color: "#aaffaa", padding: "7px 10px", cursor: "pointer", fontSize: 13, fontFamily: "'Courier New', monospace" }}>✓</button>
              )}
            </div>
          ))}
          <button onClick={async () => {
            const batch = db.batch();
            let sayac = 0;
            Object.entries(tekliDuzenle).forEach(([id, fiyat]) => {
              if (fiyat && !isNaN(parseFloat(fiyat))) {
                batch.update(db.collection("urunler").doc(id), { fiyat: parseFloat(fiyat) });
                sayac++;
              }
            });
            await batch.commit();
            setTekliDuzenle({});
            bildirimGoster(`✅ ${sayac} ürün fiyatı güncellendi!`);
          }} style={{ width: "100%", marginTop: 10, padding: "13px", background: "#1a4a8a", color: "#aaccff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "'Courier New', monospace" }}>
            💾 TÜMÜNÜ KAYDET
          </button>
        </div>
      )}

      {/* Sıralama */}
      {ayarEkran === "siralama" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <button onClick={() => setAyarEkran("menu")} style={{ background: "none", border: "none", color: S.soluk, cursor: "pointer", fontSize: 18 }}>←</button>
            <span style={{ fontSize: 14, fontWeight: "bold", flex: 1 }}>↕️ Ürün Sıralaması</span>
            <button onClick={siralamayiKaydet} style={{ background: "#1a5a1a", border: "1px solid #2a7a2a", borderRadius: 7, color: "#aaffaa", padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: "bold", fontFamily: "'Courier New', monospace" }}>💾 KAYDET</button>
          </div>
          <div style={{ fontSize: 11, color: S.soluk, marginBottom: 12 }}>Sürükle-bırak ile sıralamayı değiştir.</div>
          <div>
            {urunler.map((u, idx) => (
              <div key={u.id} className="drag-item"
                draggable
                onDragStart={() => surukleBasla(idx)}
                onDragOver={e => { e.preventDefault(); surukleUzeri(idx); }}
                onDrop={() => setSurukleIdx(null)}
                style={{ background: surukleIdx === idx ? "#2a1a40" : S.kart, border: "1px solid " + (surukleIdx === idx ? S.mor : S.border), borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, transition: "all 0.1s" }}>
                <span style={{ color: S.soluk, fontSize: 16, cursor: "grab" }}>⠿</span>
                <span style={{ fontSize: 20 }}>{u.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: "bold" }}>{u.ad}</div>
                  <div style={{ fontSize: 10, color: S.soluk }}>{u.kategori} · {u.fiyat}₺</div>
                </div>
                <span style={{ color: S.soluk, fontSize: 11 }}>#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANA UYGULAMA
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [fbHazir, setFbHazir] = useState(false);
  const [kullanici, setKullanici] = useState(null);
  const [seciliMasa, setSeciliMasa] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    // Firebase SDK'nın yüklenmesini bekle
    let deneme = 0;
    const bekle = setInterval(() => {
      deneme++;
      if (initFirebase()) {
        setFbHazir(true);
        clearInterval(bekle);
        // Oturum kontrolü
        auth.onAuthStateChanged(async user => {
          if (user) {
            const snap = await db.collection("kullanicilar").doc(user.uid).get();
            setKullanici({ uid: user.uid, email: user.email, ad: snap.data()?.ad || user.email });
          }
          setYukleniyor(false);
        });
      } else if (deneme > 20) {
        clearInterval(bekle);
        setYukleniyor(false);
      }
    }, 300);
    return () => clearInterval(bekle);
  }, []);

  async function cikisYap() {
    await auth.signOut();
    setKullanici(null);
    setSeciliMasa(null);
  }

  if (yukleniyor) return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: S.metin }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
        <div style={{ fontSize: 16, color: S.altin, letterSpacing: 3 }}>BÜFE KASA</div>
        <div style={{ fontSize: 12, color: S.soluk, marginTop: 8 }}>Yükleniyor...</div>
      </div>
    </div>
  );

  if (!fbHazir) return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: S.metin, padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, color: S.kirmizi, marginBottom: 12 }}>Firebase Yüklenemedi</div>
        <div style={{ fontSize: 12, color: S.soluk, lineHeight: 1.8 }}>
          index.html dosyanıza şu script'leri ekleyin:<br/><br/>
          <code style={{ background: S.kart, padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>firebase-app-compat.js</code><br/>
          <code style={{ background: S.kart, padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>firebase-auth-compat.js</code><br/>
          <code style={{ background: S.kart, padding: "4px 8px", borderRadius: 4, fontSize: 11 }}>firebase-firestore-compat.js</code>
        </div>
      </div>
    </div>
  );

  if (!kullanici) return <GirisEkrani onLogin={setKullanici} />;

  if (seciliMasa) return (
    <KasaEkrani masa={seciliMasa} kullanici={kullanici} onGeri={() => setSeciliMasa(null)} />
  );

  return <MasalarEkrani kullanici={kullanici} onCikis={cikisYap} onMasaSec={setSeciliMasa} />;
}
