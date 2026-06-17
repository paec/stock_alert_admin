<template>
  <div>
    <!-- 這裡是全站共用的導覽列 -->
    <nav class="app-nav">
      <div class="app-nav-brand">StockAlert Admin</div>
      <div class="app-nav-links">
        <!-- router-link 是 Vue Router 提供的導覽元件。
             和一般 <a> 不同，它切換頁面時不會整頁重新整理。 -->
        <router-link to="/" class="app-nav-link" active-class="active" exact-active-class="active">HOME</router-link>
        <router-link to="/admin" class="app-nav-link" active-class="active">ADMIN</router-link>
      </div>
    </nav>

    <!-- router-view 是路由內容的插槽。
         目前網址是 /#/ 就顯示 HomeView；
         目前網址是 /#/admin 就顯示 AdminView。 -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>
