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



