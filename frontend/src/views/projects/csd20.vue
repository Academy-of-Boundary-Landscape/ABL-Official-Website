<template>
    <div class="csd20View">
        <section class="music-link-section" style="text-align:center;margin-top:2rem;">
            <router-link to="/project/csd20/music">
                <button class="music-btn">
                    🎵 查看画册音乐特典
                </button>
            </router-link>
        </section>

        <section class="page-header">
            <div class="header-content">
                <h1 class="title">梦违科学世纪20周年合同志</h1>
                <p class="subtitle">20th Anniversary of Changeability of Strange Dream</p>
            </div>
        </section>

        <!-- 新布局：封面和制品卡片左右并排 -->
        <div class="top-layout">
            <!-- 左侧：画册封面展示 -->
            <aside class="sidebar">
                <div class="tech-box">
                    <h2 class="box-title">画册封面</h2>
                    <div class="products-list" style="display:flex;justify-content:center;">
                        <img 
                            v-if="!showCoverModal"
                            :src="cover.url" 
                            :alt="cover.title" 
                            style="width:32%;max-width:220px;cursor:pointer;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:box-shadow 0.2s;"
                            @click="showCoverModal = true"
                        />
                        <div v-if="showCoverModal" class="modal-overlay" @click="showCoverModal = false">
                            <div class="modal-content" style="display:flex;justify-content:center;align-items:center;">
                                <img 
                                    :src="cover.url" 
                                    :alt="cover.title" 
                                    style="max-width:90vw;max-height:90vh;width:auto;height:auto;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.18);" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- 右侧：制品卡片 -->
            <div class="centered-product-card">
                <AsyncBoundary
                    :loading="productLoading"
                    :error="productError"
                    :empty="productNotFound"
                    skeleton="text"
                    empty-text=">> 制品档案暂缺。"
                    @retry="refreshProduct"
                >
                    <ProductCard v-if="csd20Product" :product="csd20Product" />
                </AsyncBoundary>
            </div>
        </div>

        <!-- 下方一整行：介绍和作者信息内容 -->
        <div class="bottom-layout">
            <main class="main-content">
                <div class="tech-box">
                    <h1>画册简介</h1>
                    <p>
                        本画册是为纪念梦违科学世纪专辑发布20周年所做，里面收录了二十余位画师的精美作品。非常感谢各位画师的支持与参与。
                    </p>
                    <p>
                        画册不仅包含精美的插画，还附有部分作品的创作思路、设定说明，以及作者的感言。希望能为同好们带来视觉与精神上的双重享受。
                    </p>
                </div>
                <hr class="divider">
                <div class="tech-box">
                    <h2>画册信息</h2>
                    <ul>
                        <li><strong>名称：</strong> 梦违科学世纪20th合同志 </li>
                        <li><strong>主催：</strong> Renko_1055</li>
                        <li><strong>画师：</strong> 廻、靈、Crodelia、含烟、Arster_ 茶盒、幼月 73、白桦树 AYA、前方路口请左转、4qw5、梅子、KINGDOM、青团、雪玲、降旗原、七年藤、火球子、Interboat、Bwaity、兜转、雷花啤酒、3 皮君、早景 zaojing、木亚措</li>
                        <li><strong>页数：</strong> 40P 全彩</li>
                        <li><strong>发行时间：</strong> 2025年秋</li>
                    </ul>
                </div>
                <hr class="divider">
                <div class="tech-box">
                    <h2>购买与联系方式</h2>
                    <p>如需购买或了解更多信息，请加入社团交流群：748966747 或邮件联系：contact@secret-sealing.club</p>
                </div>
            </main>
        </div>

        <div style="height: 40px;"></div>
        <section class="tech-box">
            <h2 class="box-title">画册部分作品预览</h2>
            <div class="products-list" style="display:flex;flex-direction:column;align-items:center;">
                <img 
                    v-for="preview in previews" 
                    :key="preview.id" 
                    :src="preview.url" 
                    :alt="preview.title" 
                    style="width:100%;max-width:450px;margin-bottom:1rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);"
                />
            </div>
        </section>
    </div>
</template>
<style scoped>
/* 原为按钮上的内联 style（本就不该写这么长，收进具名规则）。
   #4f8cff 不在颜色 token 表中，且与 --color-accent（#00a8ff）差异明显，
   直接归并到 --color-accent 会改变观感，故暂时保留为字面量。
   box-shadow 的 rgba(0, 0, 0, 0.08) 是纯阴影叠加值，同样保留字面量。
   单独放一个 scoped 块：这条规则只服务于本文件的按钮，不需要也不应该
   像下方 .top-layout/.sidebar 等既存全局样式那样占据全局命名空间。 */
.music-btn {
    padding: 0.75em 2em;
    font-size: 1.2em;
    background: #4f8cff;
    color: var(--color-heading);
    border: none;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
}
</style>
<style>
.top-layout {
    display: flex;
    flex-direction: column; /* 窄屏默认值；桌面（md 及以上）见下方 @screen md 覆盖 */
    gap: 1.2rem; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
    justify-content: center;
    align-items: stretch; /* 关键：让子项高度一致 */
    margin: 2rem 0;
    min-height: 320px; /* 可根据实际内容调整最小高度 */
}
.sidebar {
    flex: 2 1 0%;
    min-width: 300px;
    max-width: 100%; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%; /* 填满父容器高度 */
}
.centered-product-card {
    flex: 1 1 0%;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 100%; /* 窄屏默认值；桌面见下方 @screen md 覆盖 */
    height: 100%; /* 填满父容器高度 */
    box-sizing: border-box;
}
.centered-product-card > * {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.bottom-layout {
    width: 100%;
    margin: 2rem 0;
    display: flex;
    justify-content: center;
}
.main-content {
    max-width: 1200px;
    width: 100%;
}
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
/* 移动优先：上方为窄屏默认值，md 及以上覆盖为桌面值 */
@screen md {
    .top-layout {
        flex-direction: row;
        gap: 2rem;
    }
    .sidebar {
        max-width: none;
    }
    .centered-product-card {
        max-width: 350px;
    }
}
</style>
<script setup>
import { ref } from 'vue';
import ProductCard from '@/components/ProductCard.vue';
import AsyncBoundary from '@/components/AsyncBoundary.vue';
import { useProductByTitle } from '@/composables/useProducts';

import coverImg from '@/assets/images/csd20related/csd_20_title.png';
import previewImg1 from '@/assets/images/csd20related/宣传图12.png';
import previewImg2 from '@/assets/images/csd20related/宣传图10.png';

const cover = ref(
    { id: 1, url: coverImg, title: '画册封面' }
);

const previews = ref([
    { id: 1, url: previewImg1, title: '预览1' },
    { id: 2, url: previewImg2, title: '预览2' },
]);
const showCoverModal = ref(false);

// 临时方案：按标题硬匹配，见 useProducts.js 里 useProductByTitle 的注释
const {
    data: csd20Product,
    loading: productLoading,
    error: productError,
    notFound: productNotFound,
    refresh: refreshProduct,
} = useProductByTitle('梦违科学世纪20周年合同志');
</script>