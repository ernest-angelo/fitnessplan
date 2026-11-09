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




Analisis Kebutuhan: di README. Tuliskan masalah, target pengguna, minimal 5 
kebutuhan pengguna, tabel pemetaan kebutuhan ke layar dan komponen, serta alasan keputusan desain dan 
rencana pengembangan.
Saya cantumkan notion yang saya gunakan untuk merekap chat dari ChatGPT saya dulu = https://app.notion.com/p/Hybrid-Application-3df5ee480a9180caa447f360326e2f3c?source=copy_link

Apa masalah yang saya ambil :
Permasalahan : Aku sering melihat orang orang diluar sana yang memiliki atau membil membership gym atau orang orang yang memiliki dream physique tapi kebanyakan dari mereka sering kebingungan disaat ingin memulai terkadang mereka sudah memiliki semangat untuk berangkat pergi ke Gym tetapi sesudah sampai gym, Seringkali aku lihat banyak orang yang baru datang ke gym untuk latihan tapi hanya tahu “oh aku hari ini latihan chest” dan di saat dia memulai workout, semua gerakan yang dia lakukan semuanya asal yang dia tahu hanya oh latihan yang barusan aku lakuin itu adalah latihan untuk chest.
Case lainnya pun juga ada dimana orang tersebut sudah memulai ngegym tapi bingung dengan workout split/routines atau singkatnya workout plan mereka seperti apa sehingga akhirnya dia memilih untuk membuka tiktok asal pilih workout plan / hanya mengikuti workout plan yang sedang ngetrend saat itu. Sehingga mereka hanya berlatih tanpa tahu tujuannya apa, kenapa kok latihannya begitu, apa yang dilatih.

Target pengguna yang saya ambil adalah :
Mahasiswa / Pelajar
Athlete
Content Creator atau sport enthusiast
Pemula di Gym

Saya akan pakai 6 Kebutuhan menurut sepemahaman saya =
1.	Pengguna dapat melakukan Register dan Login karena pengguna membutuhkan halaman untuk masuk atau mendaftar ke aplikasi.
2. Pengguna dapat melihat daftar latihan karena pengguna membutuhkan informasi mengenai latihan yang tersedia di gym mereka dengan yang ada dalam list daftar latihan aplikasi.
3.	Pengguna dapat melihat detail latihan karena pengguna membutuhkan informasi lengkap seperti deskripsi, durasi, dan tingkat kesulitan latihan yang mereka lakukan.
4.	Pengguna dapat melihat progres aktivitas olahraga karena	pengguna akan membutuhkan ringkasan aktivitas untuk mengetahui perkembangan latihan mereka.
5.	Pengguna dapat mengetahui informasi dan panduan latihan karena	pengguna membutuhkan arahan atau panduan agar dapat memahami cara melakukan latihan dengan benar.
6. Pengguna dapat berpindah antarhalaman dengan mudah karena	pengguna membutuhkan navigasi yang sederhana dan mudah dipahami sehingga tidak menghambat disaat mereka melakukan latihan.

