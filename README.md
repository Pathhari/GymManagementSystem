# 🏋️ GymCentric – Gym Management System

**GymCentric** is a modern gym management system built with Laravel, designed to simplify membership, staff, facility, booking, and finance operations for gyms of any size.

## 🚀 Features

- **Member Management**: Registration, plans, attendance, lockers  
- **Staff Management**: Scheduling, tasks, performance, payroll  
- **Facilities**: Equipment logs, branch ops, usage tracking  
- **Finance**: Payments, invoices, expense reports  
- **Bookings**: Class scheduling, waitlists, attendance  
- **Analytics**: Membership stats, revenue, usage patterns  
- **Communication**: Email (Mailjet), SMS (Semaphore) alerts  

## 🛠 Tech Stack

- **Backend**: Laravel 10, PHP 8.2  
- **Frontend**: Blade, Tailwind CSS, Alpine.js  
- **Database**: MySQL  
- **Auth**: Laravel Fortify, WebAuthn  
- **Messaging**: Mailjet, Semaphore  
- **Planned**: Payment gateway integration  

## ⚙️ Installation

```bash
git clone https://github.com/yourusername/gymcentric.git
cd gymcentric
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run build
php artisan serve
