FROM nginx:alpine

# Copy static assets to default Nginx html folder
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY memory-system.js /usr/share/nginx/html/
COPY tutor-engine.js /usr/share/nginx/html/
COPY sandbox-runner.js /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY vercel.json /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
