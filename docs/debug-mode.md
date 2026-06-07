# Debug Mode - Testing Tampilan Layar

## Ringkasan

Debug mode memungkinkan testing tampilan berbagai mode layar tanpa menunggu waktu sholat tiba. Aktifkan via URL parameter `?debug=...`.

## Cara Penggunaan

Tambahkan `?debug=` di URL display page:

```
http://localhost:5173/display/ABC123?debug=mood:adzan
```

## Parameter Tersedia

| Parameter | Nilai | Keterangan |
|-----------|-------|------------|
| `mood` | `adzan`, `iqamah`, `khusuk`, `normal` | Layar mood overlay |
| `flash` | `adzan`, `iqamah` | Flash layar (sekali trigger) |
| `preAdzan` | `1` - `60` | Countdown pre-adzan (detik) |
| `screensaver` | *(tanpa nilai)* | Mode screensaver |
| `tahajud` | *(tanpa nilai)* | Mode tahajud (2 kolom) |

## Kombinasi Parameter

Pisahkan dengan koma untuk kombinasi:

```
?debug=mood:adzan,preAdzan:30
```

## Prioritas (Tinggi ke Rendah)

1. `screensaver` - paling prioritas
2. `tahajud`
3. `flash` + `preAdzan` + `mood` - bisa aktif bersamaan

## Contoh URL

### Mood Overlay

```bash
# Layar adzan
http://localhost:5173/display/ABC123?debug=mood:adzan

# Layar iqamah
http://localhost:5173/display/ABC123?debug=mood:iqamah

# Layar khusuk
http://localhost:5173/display/ABC123?debug=mood:khusuk

# Layar jumat (adzan + dzuhur + hari jumat)
# Note: butuh hari jumat asli, debug hanya force mood
http://localhost:5173/display/ABC123?debug=mood:adzan
```

### Flash Overlay

```bash
# Flash adzan (kuning keemasan)
http://localhost:5173/display/ABC123?debug=flash:adzan

# Flash iqamah (hijau)
http://localhost:5173/display/ABC123?debug=flash:iqamah
```

### Pre-Adzan Countdown

```bash
# Countdown 45 detik
http://localhost:5173/display/ABC123?debug=preAdzan:45

# Countdown 10 detik
http://localhost:5173/display/ABC123?debug=preAdzan:10
```

### Screensaver & Tahajud

```bash
# Mode screensaver
http://localhost:5173/display/ABC123?debug=screensaver

# Mode tahajud (2 kolom)
http://localhost:5173/display/ABC123?debug=tahajud
```

### Kombinasi

```bash
# Mood + countdown
http://localhost:5173/display/ABC123?debug=mood:adzan,preAdzan:30

# Flash + mood (flash trigger sekali, mood persisten)
http://localhost:5173/display/ABC123?debug=flash:iqamah,mood:khusuk
```

## Normal Mode

Hapus parameter `?debug=...` untuk kembali ke mode normal:

```bash
http://localhost:5173/display/ABC123
```

## Catatan Teknis

- Debug mode **persisten** selama URL parameter ada (state di-override tiap detik)
- Console browser akan log: `[debug] Overrides applied: {...}`
- Flash hanya trigger **sekali** (ada flag `flashTriggered`)
- Data dari API tetap di-fetch, tapi state di-override oleh debug param
- Tidak mempengaruhi logic sholat asli (hanya visual)

## Testing Checklist

- [ ] Mood adzan - tampilan + countdown
- [ ] Mood iqamah - tampilan + countdown
- [ ] Mood khusuk - tampilan + countdown
- [ ] Flash adzan - warna kuning, animasi 3s
- [ ] Flash iqamah - warna hijau, animasi 3s
- [ ] Pre-adzan countdown - circle progress + arabic text
- [ ] Screensaver - 2 kolom (masjid + jadwal)
- [ ] Tahajud - 2 kolom (waktu + ayat)
- [ ] Kombinasi parameter
- [ ] Vertical orientation (tambah `?orientation=vertical` atau set di DB)

## Implementasi

File yang dimodifikasi:
- `src/routes/(tv)/display/[deviceCode]/+page.svelte`
  - `parseDebugParam()` - parse URL parameter
  - `applyDebugOverrides()` - apply state override
  - Dipanggil di `onMount()` dan `prayerInterval`
