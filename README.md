Link penggunaan AI saya= https://chatgpt.com/share/6af0c505-7dd4-83ec-9ce6-6abca58acedc

Penjelasan Konsep: di README, 300–500 kata. Jelaskan cara kerja React Native, minimal 
3 keunggulannya untuk aplikasi hybrid, serta komponen, props, state, dan navigasi dengan contoh kode 
sendiri.

Penjelasan tentang React Native dan cara kerjanya: 
React Native adalah sebuah framework open-source yang dikembangkan oleh Meta untuk mempermudah developer dalam membangun aplikasi mobile menggunakan javascript atau typescript dan juga react. React native mempermudah developer dengan cara pengembangan suatu aplikasi untuk Android dan IOS dapat dilakukan hanya dengan menggunakan single codebase sehingga developer tidak perlu melakukan penyesuaian antara develop di android atau di ios. React native menerjemahkan komponen komponen yang ada dalam react menjadi komponen antarmuka native pada sistem operasi. Sehingga dapat menampilkan halaman web di dalam aplikasi selain itu React juga menggunakan komponen native untuk membangun antarmuka pengguna. React Native bekerja dengan cara menggabungkan kode JavaScript dan React untuk mengontrol dan merender komponen antarmuka dan asli di perangkat Android maupun iOS.

3 Keunggulan react native untuk aplikasi hybrid
Cross-platform Development: Developer dapat mengembangkan aplikasi Android dan iOS menggunakan single codebase sehingga developer tidak perlu mengerjakan aplikasi 2 kali atau duplikasi pengerjaan.

Reusable Components: Komponen antarmuka dapat digunakan kembali pada berbagai halaman sehingga kode lebih konsisten dan mudah di manage.

Fast Development: React Native mendukung Fast Refresh sehingga developer dapat melihat perubahan kode dengan cepat tanpa harus selalu membangun ulang aplikasi dari awal. Jadi pada saat development jika terjadi error dapat diperbaiki secara langsung sehingga tidak diperlukan membangun ulang aplikasi dari awal

Penjelasan component dan contoh dari code sendiri
Component merupakan bagian terkecil dari antarmuka aplikasi yang dapat digunakan kembali. Dalam aplikasi yang sedang saya develop contoh code saya ambil dari (auth)/register.tsx yaitu functional component
export default function RegisterScreen() {
selain itu ada juga component bawaan dari react native seperti view, text, dan lainnya 
 <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      
Penjelasan Props dan State + contoh dari code sendiri
Props merupakan data yang dikirimkan dari komponen induk (parent) ke komponen anak (child). Props digunakan untuk membuat komponen lebih fleksibel.
State merupakan data internal komponen yang dapat berubah selama aplikasi berjalan. React menyediakan useState untuk mengelola state.
Contoh disini saya ambil dari (auth)/register.tsx dan disini props and state ada dalam functional component yang saya buat
export default function RegisterScreen() {
  const [email, setEmail] = useState(''); // Menyimpan email yang diketik pengguna
  const [password, setPassword] = useState(''); // Menyimpan password yang diketik pengguna
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

State = Data yang disimpan aplikasi. Contohnya email dan password yang diketik pengguna. 
Props = Informasi yang diberikan kepada component. Contohnya tulisan "Email" yang diberikan kepada TextInput.

Penjelasan Navigation dan contoh dari code sendiri
Navigation merupakan mekanisme atau sistem perpindahan antarhalaman dalam aplikasi. Setiap file halaman di dalam direktori app dapat menjadi sebuah route. Navigasi dapat dilakukan menggunakan router.push() atau router.replace untuk membuka halaman lain.
Contoh disini saya ambil dari (auth)/register.tsx
router.replace('/(tabs)');
Kenapa saya menggunakan router.replace sedangkan router.push karena Router.replace lebih cocok untuk perpindahan dari page register/login ke home page karena dengan menggunakan router.replace pengguna tidak bisa kembali ke halaman sebelumnya menggunakan tombol Back browser karena halaman tersebut sudah ditimpa/dihapus dari riwayat sedangkan jika menggunakan router.push pengguna dapat menggunakan tombol back browser lalu kembali ke halaman sebelumnya
