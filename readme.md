# Galáxia Interativa com Estrelas Personalizadas

Uma visualização 3D interativa de galáxia usando Three.js, onde usuários podem criar e compartilhar suas próprias estrelas personalizadas.

## Funcionalidades

- Visualização 3D de galáxia procedural com 5000 estrelas
- Sistema de autenticação completo (login/registro)
- Criação de estrelas personalizadas com foto e mensagem
- Limite de 5 estrelas por usuário
- Animação de piscar em estrelas recém-criadas
- Menu administrativo para localizar suas estrelas
- Navegação automática da câmera até estrelas específicas
- Clique nas estrelas para ver informações detalhadas
- Persistência de dados com Supabase

## Como Usar

Este é um projeto baseado em CDN que não requer build. Simplesmente abra o arquivo `index.html` em um navegador web moderno, ou use qualquer servidor HTTP estático.

Para desenvolvimento local, você pode usar um servidor HTTP simples como:

```bash
python -m http.server 8080
```

Ou qualquer outro servidor estático de sua preferência.

## Tecnologias

- Three.js - Renderização 3D
- Supabase - Backend e autenticação
- JavaScript ES6 Modules - Via CDN
- CSS3 - Estilização moderna