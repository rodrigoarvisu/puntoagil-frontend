import { useEffect, useState } from "react";
import swal from 'sweetalert2';
import { Notyf } from "notyf";
import 'notyf/notyf.min.css';
import MainLayout from "../components/layout/MainLayout";
import { usuariosApi, type UsuarioData } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";

const notyf = new Notyf();
const formVacio = { nombre: '', email: '', password: '', rol: 'CAJERO' as 'ADMIN' | 'CAJERO' };