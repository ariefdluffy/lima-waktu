## Quick Start Testing

### 1. Test di Browser (Paling Cepat)

```bash
# Terminal 1: Jalankan dev server
npm run dev

# Terminal 2: Buka browser
# Akses: http://localhost:5173/display-preview
```

**Langkah Testing:**
1. Buka DevTools (F12)
2. Klik Device Toolbar (Ctrl+Shift+M)
3. Pilih "Edit" → Masukkan: Width: 1366, Height: 768
4. Refresh halaman
5. Verifikasi:
   - ✅ Font tidak terlalu besar
   - ✅ Semua elemen terlihat
   - ✅ Tidak ada overflow
   - ✅ Layout tetap 3-panel

### 2. Test di TV Fisik

1. Akses URL display dari TV: `http://<server-ip>:5173/display/<device-code>`
2. Verifikasi tampilan pada resolusi 1366×768
3. Bandingkan dengan sebelum perbaikan

## Troubleshooting

### Jika Font Masih Terlalu Besar

Edit `src/lib/styles/display-hd-1366.css` dan kurangi nilai:

```css
/* Contoh: Kurangi header time */
.header-time {
  font-size: clamp(22px, 3.8vw, 64px);
  /* Ubah menjadi: */
  font-size: clamp(20px, 3.5vw, 56px);
}
```

### Jika Font Terlalu Kecil

Naikkan nilai maksimum di `clamp()`:

```css
.header-time {
  font-size: clamp(22px, 3.8vw, 64px);
  /* Ubah menjadi: */
  font-size: clamp(22px, 3.8vw, 72px);
}
```

### Jika Layout Berantakan

Periksa `--panel-gap` dan `--panel-padding` di root:

```css
:root {
  --panel-gap: 0.8%;      /* Kurangi jika terlalu besar */
  --panel-padding: 0.8%;  /* Kurangi jika terlalu besar */
}
```

## Performance Notes

- CSS file baru: 352 baris
- Media query specificity: `max-width: 1366px AND max-height: 768px`
- No JavaScript changes required
- Zero performance impact

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern TV browsers

## Next Steps

1. Deploy perubahan ke production
2. Test di TV dengan resolusi 1366×768
3. Collect feedback dari pengguna
4. Adjust font sizes jika diperlukan
5. Consider membuat breakpoint tambahan untuk resolusi lain

---

**Created**: 2026-05-23
**Status**: Ready for Testing
**Priority**: High (User-facing display issue)
