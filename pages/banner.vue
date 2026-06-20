<template>
  <div class="min-h-screen flex justify-center py-10 pb-16 font-sans antialiased"
       style="background: radial-gradient(1200px 600px at 50% -200px, #eaf0f8 0%, rgba(234,240,248,0) 60%), #DDE3EC;">
    <div class="w-[880px] max-w-full bg-white overflow-hidden"
         style="box-shadow: 0 30px 80px -30px rgba(20,30,55,.28), 0 4px 18px -8px rgba(20,30,55,.12);">

      <!-- BRANDBAR -->
      <header class="flex items-center px-[72px] py-6 border-b border-[#E7EAF0]">
        <div class="flex items-center gap-4">
          <img src="/images/nex-banner/logo-gec.png" alt="GEC" class="h-[52px] w-auto pr-4 border-r border-[#E7EAF0]">
          <div class="leading-[1.15]">
            <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[15.5px] tracking-[0.005em] text-[#14181F] max-w-[30ch]">
              General Electronic Commerce Services Co., Ltd.
            </div>
          </div>
        </div>
      </header>

      <!-- HERO -->
      <section class="px-[72px] py-[44px] grid grid-cols-[1fr_312px] items-center gap-[46px]">
        <div>
          <div class="text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#14467F] mb-4 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
            NEX Finance · Invoice Financing
          </div>
          <h1 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[43px] leading-[1.07] tracking-[-0.01em] text-[#14181F]">
            <span class="block">เปลี่ยนใบวางบิล<br>ให้เป็น<span class="text-[#B4182B]">เงินสด</span></span>
            <span class="block font-semibold text-[0.5em] text-[#14467F] mt-[0.32em] tracking-normal font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
              Turn your invoices into cash
            </span>
          </h1>
          <p class="mt-5 text-[15.5px] leading-[1.6] text-[#5B6573] max-w-[46ch] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
            <span class="block">สินเชื่อแฟคเตอริ่งสำหรับคู่ค้า Modern Trade — ดึงใบแจ้งหนี้และเอกสารการค้าที่อยู่บน GEC NEX Platform มาขอรับเงินล่วงหน้าได้ทันที โดยไม่ต้องรอรอบการเก็บเงิน</span>
            <span class="block text-[0.88em] mt-[0.95em]">Factoring built for Modern Trade suppliers — pull the invoices you already have on the GEC NEX Platform and get paid in advance, without waiting for the payment cycle.</span>
          </p>

          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-2.5 mt-7 px-7 py-3.5 rounded-[14px] font-['Anuphan',system-ui,sans-serif] font-bold text-[16px] text-white bg-[#B4182B] transition-all duration-200 ease-out hover:bg-[#8C0F20] hover:shadow-[0_8px_24px_-8px_rgba(180,24,43,.65)] hover:-translate-y-px active:translate-y-0 active:shadow-none select-none"
          >
            <span>สมัครใช้งานฟรี</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </NuxtLink>
        </div>

        <!-- Fund Card -->
        <div class="flex justify-end">
          <div class="w-[312px] bg-white border border-[#E7EAF0] rounded-[22px] p-5 pb-[18px]"
               style="box-shadow: 0 30px 60px -28px rgba(20,70,127,.40), 0 6px 18px -10px rgba(16,24,40,.12);">
            <div class="flex items-center justify-between gap-2.5 pb-3.5 border-b border-[#EEF1F6]">
              <div class="inline-flex items-baseline gap-[0.12em] leading-none font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
                <span class="font-extrabold tracking-[-0.045em] text-[#16234D] text-[20px]">NEX</span>
                <span class="font-medium tracking-[-0.035em] text-[#2C5FE0] text-[20px]">Finance</span>
              </div>
              <span class="text-[10px] font-semibold tracking-[0.06em] uppercase text-[#14467F] bg-[#EEF4FB] rounded-full px-2.5 py-[5px] whitespace-nowrap font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
                เงินทุนพร้อมใช้
              </span>
            </div>

            <div class="mt-3.5 bg-gradient-to-br from-[#EEF4FB] to-[#F6F9FD] border border-[#EEF1F6] rounded-[16px] overflow-hidden">
              <svg viewBox="0 0 260 150" fill="none" class="w-full h-auto block">
                <path d="M26 122 88 84 128 104 210 46" stroke="#C6D6EA" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 9"/>
                <path d="M210 46l-13 1.5m13-1.5-2 13" stroke="#B4182B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="62" y="74" width="118" height="60" rx="9" fill="#103C6E"/>
                <rect x="54" y="64" width="118" height="60" rx="9" fill="#1B5394"/>
                <rect x="46" y="54" width="118" height="60" rx="9" fill="#2E72C0"/>
                <circle cx="78" cy="84" r="16" fill="#EAF2FB"/>
                <text x="78" y="91" font-size="19" font-weight="700" fill="#14467F" text-anchor="middle" font-family="Anuphan, sans-serif">฿</text>
                <rect x="104" y="74" width="48" height="5" rx="2.5" fill="rgba(255,255,255,.55)"/>
                <rect x="104" y="86" width="34" height="5" rx="2.5" fill="rgba(255,255,255,.4)"/>
                <ellipse cx="206" cy="124" rx="22" ry="7" fill="#0E8A5F" opacity=".2"/>
                <circle cx="206" cy="108" r="17" fill="#0E8A5F"/>
                <circle cx="206" cy="104" r="17" fill="#16B57C"/>
                <text x="206" y="110" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" font-family="Anuphan, sans-serif">฿</text>
              </svg>
            </div>

            <div class="flex items-center gap-2 mt-4">
              <div class="flex-1 text-center">
                <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-none text-[#14467F]">
                  90<span class="text-[0.5em] ml-px text-[#2E72C0]">%</span>
                </div>
                <div class="text-[11.5px] text-[#5B6573] mt-[5px] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">รับเงินล่วงหน้า</div>
              </div>
              <div class="w-px self-stretch bg-[#E7EAF0] my-0.5"></div>
              <div class="flex-1 text-center">
                <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-none text-[#14467F]">
                  24<span class="text-[0.5em] ml-px text-[#2E72C0]">h</span>
                </div>
                <div class="text-[11.5px] text-[#5B6573] mt-[5px] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">รับเงินเข้าบัญชี</div>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-2.5 bg-[#E9F6F0] rounded-[11px] px-3 py-[11px] text-[12px] leading-[1.4] text-[#0B6B4A] font-medium font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
              <svg class="flex-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="m3 8 3.2 3.2L13 4.5" stroke="#0E8A5F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>เสริมสภาพคล่องได้ทันที ไม่ต้องใช้หลักทรัพย์</span>
            </div>
          </div>
        </div>
      </section>

      <!-- PROBLEM -->
      <section class="mt-2 bg-[#14467F] text-white px-[72px] py-[40px] relative overflow-hidden">
        <div class="absolute right-[-80px] top-[-80px] w-[260px] h-[260px] rounded-full bg-white/5 pointer-events-none"></div>
        <div class="text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#9CC2EE] mb-3.5 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          The seller's challenge
        </div>
        <h2 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[28px] leading-[1.22] mt-3.5 max-w-[32ch]">
          <span class="block">ส่งสินค้าให้ Modern Trade แล้ว แต่ต้องรอเก็บเงิน <span class="text-[#FFD23F]">30–90 วัน</span>?</span>
          <span class="block text-[0.55em] text-white/60 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium mt-2">
            Delivered to Modern Trade — but waiting 30–90 days to get paid?
          </span>
        </h2>
        <p class="mt-[18px] text-[14.5px] leading-[1.6] text-white/80 max-w-[58ch] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          <span class="block">เครดิตเทอมที่ยาวนานทำให้กระแสเงินสดติดขัด ทั้งที่คุณยังต้องสต๊อกสินค้า จ่ายซัพพลายเออร์ และหมุนเวียนธุรกิจอย่างต่อเนื่อง</span>
          <span class="block text-[0.88em] text-white/55 mt-3">Long credit terms lock up your cash flow — even as you restock, pay suppliers, and keep the business running.</span>
        </p>
      </section>

      <!-- HOW IT WORKS -->
      <section class="px-[72px] py-[48px] pb-[44px]">
        <div class="mb-[30px]">
          <span class="block text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#14467F] mb-3 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
            How NEX Finance works
          </span>
          <h2 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-[1.18] text-[#14181F]">
            <span class="block">ข้อมูลของคุณอยู่บน
              <img src="/images/nex-banner/logo-nexinline.png" alt="GEC NEX" class="inline-block h-[1.15em] w-auto align-[-0.22em] mx-[0.18em]">
              อยู่แล้ว ขอสินเชื่อจึงเสร็จในไม่กี่ขั้นตอน
            </span>
            <span class="block text-[0.5em] text-[#14467F] font-semibold font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] mt-2">
              Your data already lives on
              <img src="/images/nex-banner/logo-nexinline.png" alt="GEC NEX" class="inline-block h-[1.15em] w-auto align-[-0.22em] mx-[0.18em]">
              — so financing is just a few steps.
            </span>
          </h2>
        </div>

        <div class="grid grid-cols-3 gap-[18px]">
          <!-- Step 1 -->
          <div class="border border-[#E7EAF0] rounded-[16px] p-[22px] pb-6 bg-white relative"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[13px] text-white bg-[#14467F] w-[26px] h-[26px] rounded-[8px] grid place-items-center mb-4">1</div>
            <span class="text-[#14467F] mb-3.5 block">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="3.5" width="20" height="21" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8.5 10h11M8.5 14h11M8.5 18h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="20.5" cy="19.5" r="5" fill="#fff" stroke="currentColor" stroke-width="1.8"/>
                <path d="m18.5 19.5 1.4 1.4 2.4-2.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <h4 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[16.5px] leading-[1.3]">
              <span class="block">เลือกใบแจ้งหนี้</span>
              <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Select invoices</span>
            </h4>
            <p class="mt-[9px] text-[13px] leading-[1.5] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
              <span class="block">เลือกใบแจ้งหนี้ Modern Trade ที่ต้องการ ได้โดยตรงบน GEC NEX Platform</span>
              <span class="block text-[0.92em] mt-1">Pick the Modern Trade invoices you want to finance, right on the platform.</span>
            </p>
          </div>

          <!-- Step 2 -->
          <div class="border border-[#E7EAF0] rounded-[16px] p-[22px] pb-6 bg-white relative"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[13px] text-white bg-[#14467F] w-[26px] h-[26px] rounded-[8px] grid place-items-center mb-4">2</div>
            <span class="text-[#14467F] mb-3.5 block">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M24 4 12.5 15.5M24 4l-7.5 20-4-9-9-4L24 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <h4 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[16.5px] leading-[1.3]">
              <span class="block">ยื่นขอสินเชื่อออนไลน์</span>
              <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Apply online</span>
            </h4>
            <p class="mt-[9px] text-[13px] leading-[1.5] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
              <span class="block">ส่งคำขอพร้อมเอกสารการค้าที่มีอยู่แล้ว เอกสารน้อย พิจารณาไว</span>
              <span class="block text-[0.92em] mt-1">Submit with the trade documents you already have — minimal paperwork, fast review.</span>
            </p>
          </div>

          <!-- Step 3 -->
          <div class="border border-[#E7EAF0] rounded-[16px] p-[22px] pb-6 bg-white relative"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[13px] text-white bg-[#14467F] w-[26px] h-[26px] rounded-[8px] grid place-items-center mb-4">3</div>
            <span class="text-[#14467F] mb-3.5 block">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="7" width="22" height="15" rx="2.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M3 11h22" stroke="currentColor" stroke-width="1.8"/>
                <path d="M19 16.5h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M14 2.5 18 7M14 2.5 10 7M14 2.5V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <h4 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[16.5px] leading-[1.3]">
              <span class="block">รับเงินเข้าบัญชี</span>
              <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Get funded</span>
            </h4>
            <p class="mt-[9px] text-[13px] leading-[1.5] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
              <span class="block">รับเงินล่วงหน้าสูงสุด 90% ของมูลค่าบิล ภายใน 24 ชั่วโมง</span>
              <span class="block text-[0.92em] mt-1">Receive up to 90% of the invoice value within 24 hours.</span>
            </p>
          </div>
        </div>
      </section>

      <!-- BENEFITS -->
      <section class="px-[72px] py-[44px] pb-12 bg-[#F4F6FA] border-t border-b border-[#E7EAF0]">
        <div class="mb-[28px]">
          <span class="block text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#14467F] mb-3 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
            Why choose NEX Finance
          </span>
          <h2 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-[1.18] text-[#14181F]">
            <span class="block">ออกแบบมาเพื่อคู่ค้า Modern Trade</span>
            <span class="block text-[0.5em] text-[#14467F] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-semibold mt-2">Designed for Modern Trade partners</span>
          </h2>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Benefit 1 -->
          <div class="flex gap-4 items-start bg-white border border-[#E7EAF0] rounded-[16px] p-[22px]"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="flex-none w-[42px] h-[42px] rounded-[12px] bg-[#FBEEF0] text-[#B4182B] grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="m5 11.5 4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[19px] leading-[1.25]">
                <span class="block">อนุมัติง่าย เอกสารน้อย</span>
                <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Easy approval, minimal docs</span>
              </div>
              <p class="mt-[7px] text-[12.5px] text-[#5B6573] leading-[1.5] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
                <span class="block">ใช้เอกสารการค้าที่อยู่บนแพลตฟอร์ม ลดขั้นตอนยุ่งยาก</span>
                <span class="block text-[0.92em] mt-1">Uses the trade documents already on the platform.</span>
              </p>
            </div>
          </div>

          <!-- Benefit 2 -->
          <div class="flex gap-4 items-start bg-white border border-[#E7EAF0] rounded-[16px] p-[22px]"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="flex-none w-[42px] h-[42px] rounded-[12px] bg-[#FBEEF0] text-[#B4182B] grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="m5 11.5 4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[19px] leading-[1.25]">
                <span class="block">รับเงินล่วงหน้าสูงสุด <span class="text-[#B4182B]">90%</span></span>
                <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Up to 90% advance</span>
              </div>
              <p class="mt-[7px] text-[12.5px] text-[#5B6573] leading-[1.5] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
                <span class="block">เสริมสภาพคล่องได้ทันที ไม่ต้องรอรอบบิลของ Modern Trade</span>
                <span class="block text-[0.92em] mt-1">Boost liquidity without waiting for the billing cycle.</span>
              </p>
            </div>
          </div>

          <!-- Benefit 3 -->
          <div class="flex gap-4 items-start bg-white border border-[#E7EAF0] rounded-[16px] p-[22px]"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="flex-none w-[42px] h-[42px] rounded-[12px] bg-[#FBEEF0] text-[#B4182B] grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="m5 11.5 4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[19px] leading-[1.25]">
                <span class="block">ไม่ใช้หลักทรัพย์ค้ำประกัน</span>
                <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">No collateral required</span>
              </div>
              <p class="mt-[7px] text-[12.5px] text-[#5B6573] leading-[1.5] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
                <span class="block">พิจารณาจากใบแจ้งหนี้เป็นหลัก ไม่ต้องวางทรัพย์สิน</span>
                <span class="block text-[0.92em] mt-1">Backed by your receivables, not your assets.</span>
              </p>
            </div>
          </div>

          <!-- Benefit 4 -->
          <div class="flex gap-4 items-start bg-white border border-[#E7EAF0] rounded-[16px] p-[22px]"
               style="box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px -16px rgba(16,24,40,.18);">
            <div class="flex-none w-[42px] h-[42px] rounded-[12px] bg-[#FBEEF0] text-[#B4182B] grid place-items-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="m5 11.5 4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[19px] leading-[1.25]">
                <span class="block">รับเงินไวภายใน 24 ชม.</span>
                <span class="block text-[0.62em] text-[#5B6573] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium">Funded within 24 hours</span>
              </div>
              <p class="mt-[7px] text-[12.5px] text-[#5B6573] leading-[1.5] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
                <span class="block">เมื่อเอกสารครบถ้วน รับเงินเข้าบัญชีได้อย่างรวดเร็ว</span>
                <span class="block text-[0.92em] mt-1">Once documents are complete, cash arrives fast.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- PARTNERS -->
      <section class="px-[72px] py-[42px] pb-[40px]">
        <div class="mb-[22px]">
          <span class="block text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#14467F] mb-3 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
            Trusted across Modern Trade
          </span>
          <h2 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-[1.18] text-[#14181F]">
            <span class="block">รองรับคู่ค้า Modern Trade ชั้นนำทั่วประเทศ</span>
            <span class="block text-[0.5em] text-[#14467F] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-semibold mt-2">Supporting leading Modern Trade chains nationwide</span>
          </h2>
        </div>

        <div class="flex flex-wrap gap-2.5">
          <span class="font-['Anuphan',system-ui,sans-serif] font-semibold text-[15px] text-white bg-[#14467F] border border-[#14467F] rounded-full px-5 py-2.5 tracking-[0.01em]"
                style="box-shadow: 0 6px 16px -8px rgba(20,70,127,.55);">7-Eleven</span>
          <span class="font-['Anuphan',system-ui,sans-serif] font-semibold text-[14px] text-[#14181F] bg-[#F4F6FA] border border-[#E7EAF0] rounded-full px-4 py-[9px] tracking-[0.01em]">Makro</span>
          <span class="font-['Anuphan',system-ui,sans-serif] font-semibold text-[14px] text-[#14181F] bg-[#F4F6FA] border border-[#E7EAF0] rounded-full px-4 py-[9px] tracking-[0.01em]">Lotus's</span>
          <span class="font-['Anuphan',system-ui,sans-serif] font-semibold text-[14px] text-[#14181F] bg-[#F4F6FA] border border-[#E7EAF0] rounded-full px-4 py-[9px] tracking-[0.01em]">Tops</span>
        </div>
        <p class="mt-4 text-[12.5px] text-[#8A929E] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          <span class="block">และคู่ค้า Modern Trade ชั้นนำรายอื่น ๆ บน GEC NEX Platform</span>
          <span class="block mt-1">and other leading Modern Trade partners on the GEC NEX Platform</span>
        </p>
      </section>

      <!-- CTA -->
      <section class="px-[72px] py-[44px] pb-[40px] text-white relative overflow-hidden"
               style="background: linear-gradient(135deg, #B4182B 0%, #8C0F20 100%);">
        <div class="absolute left-[-60px] bottom-[-90px] w-[280px] h-[280px] rounded-full bg-white/6 pointer-events-none"></div>
        <div class="text-[12.5px] font-semibold tracking-[0.16em] uppercase text-[#F6C9CE] mb-3.5 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          Special offer
        </div>
        <h2 class="font-['Anuphan',system-ui,sans-serif] font-bold text-[30px] leading-[1.2] mt-3.5 max-w-[26ch]">
          <span class="block">สมัครวันนี้ รับ<span class="text-[#FFD23F]">เงื่อนไขและสิทธิประโยชน์สุดพิเศษ</span> จากสถาบันการเงินพันธมิตรของเรา</span>
          <span class="block text-[0.52em] text-white/75 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] font-medium mt-2">
            Apply today and receive exclusive terms and benefits from our partner financial institutions.
          </span>
        </h2>

        <div class="mt-5 inline-flex items-center gap-2.5 bg-white/12 border border-white/22 rounded-[14px] px-4 py-3 text-[13.5px] leading-[1.5] max-w-[60ch] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          <svg class="flex-none" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2.5l2.5 5.2 5.7.8-4.1 4 1 5.7L11 15.6 5.9 18.2l1-5.7-4.1-4 5.7-.8L11 2.5Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          <span>
            <span class="block">เงื่อนไขพิเศษนี้มอบให้โดยสถาบันการเงินพันธมิตร สำหรับผู้สมัครรายใหม่บน GEC NEX Platform เท่านั้น</span>
            <span class="block text-[0.86em] text-white/70 mt-[0.3em]">Special conditions provided by our partner financial institutions — available to new applicants on the GEC NEX Platform.</span>
          </span>
        </div>

        <div class="mt-[30px] flex flex-wrap items-center gap-x-[30px] gap-y-4 pt-6 border-t border-white/18">
          <div class="flex items-center gap-3">
            <div class="flex-none w-10 h-10 rounded-[11px] bg-white/14 grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6.5 3.5 8 7l-2 1.5c.9 2 2.5 3.6 4.5 4.5L12 11l3.5 1.5v3c0 1-.8 1.7-1.8 1.5C7.5 16.3 3.7 12.5 2.5 5.3 2.3 4.3 3 3.5 4 3.5h2.5Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] tracking-[0.08em] uppercase text-white/65 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">Contact</div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[18px] mt-0.5 whitespace-nowrap">คุณต้น · 089-185-8327</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-none w-10 h-10 rounded-[11px] bg-white/14 grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2.5" y="4.5" width="15" height="11" rx="1.8" stroke="#fff" stroke-width="1.6"/>
                <path d="m3 5.5 7 5 7-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] tracking-[0.08em] uppercase text-white/65 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">Email</div>
              <div class="font-['Anuphan',system-ui,sans-serif] font-bold text-[18px] mt-0.5 whitespace-nowrap">NexFinance@gec.co.th</div>
            </div>
          </div>
        </div>

        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2.5 mt-8 px-8 py-4 rounded-[14px] font-['Anuphan',system-ui,sans-serif] font-bold text-[17px] text-[#B4182B] bg-white transition-all duration-200 ease-out hover:bg-[#FFF5F6] hover:shadow-[0_10px_30px_-8px_rgba(0,0,0,.35)] hover:-translate-y-px active:translate-y-0 active:shadow-none select-none"
        >
          <span>สมัครใช้งานฟรีเลย</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3.5 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>
      </section>

      <!-- FOOTER -->
      <footer class="px-[72px] py-[22px] pb-[26px] flex items-center justify-between gap-[18px] bg-[#14181F]">
        <div class="text-[11.5px] tracking-[0.02em] text-white/70 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          Powered by <b class="text-white font-semibold">GEC</b>
          <span class="text-white/35 mx-[0.12em]">·</span>
          <b class="text-white font-semibold">Kota Capital</b>
          <span class="text-white/35 mx-[0.12em]">·</span>
          <b class="text-white font-semibold">IceKredit</b>
        </div>
        <div class="text-[10.5px] text-white/45 text-right max-w-[46ch] leading-[1.45] font-['IBM_Plex_Sans_Thai',system-ui,sans-serif]">
          <span class="block">*เงื่อนไขการพิจารณาสินเชื่อเป็นไปตามหลักเกณฑ์ที่บริษัทฯ กำหนด</span>
          <span class="block text-[0.94em] mt-[0.35em]">*Credit approval is subject to the company's criteria.</span>
        </div>
      </footer>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'NEX Finance — สินเชื่อแฟคเตอริ่งสำหรับคู่ค้า Modern Trade',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700;800&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;800&display=swap',
    },
  ],
})

definePageMeta({
  layout: false,
})
</script>

<style>
@media print {
  body { background: #fff !important; }
}
</style>
