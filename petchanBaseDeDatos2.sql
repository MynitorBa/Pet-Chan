PGDMP      (    	            }            pet_chan    17.4    17.4                0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    32791    pet_chan    DATABASE     n   CREATE DATABASE pet_chan WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'es-ES';
    DROP DATABASE pet_chan;
                     postgres    false                      0    32866 
   accesorios 
   TABLE DATA           :   COPY public.accesorios (id, indice, id_users) FROM stdin;
    public               postgres    false    224   
                 0    32816    items 
   TABLE DATA           @   COPY public.items (id, indice, categoria, id_users) FROM stdin;
    public               postgres    false    222   M
                 0    32802    pets 
   TABLE DATA           �   COPY public.pets (id, petname, genero, indice, "nivelAmor", "nivelFelicidad", "nivelEnergia", habilidad, "comidaFavorita", id_users) FROM stdin;
    public               postgres    false    220   X       	          0    32793    users 
   TABLE DATA           S   COPY public.users (id, username, password, description, money, corral) FROM stdin;
    public               postgres    false    218   �                  0    0    accesorios_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.accesorios_id_seq', 28, true);
          public               postgres    false    223                       0    0    items_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.items_id_seq', 121, true);
          public               postgres    false    221                       0    0    pets_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.pets_id_seq', 19, true);
          public               postgres    false    219                       0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 31, true);
          public               postgres    false    217                   x�34�4�42�2� ��\F �؀+F��� =��         �   x�e�Mn�0F��0���ܥ�(���f)ӹ	#��,�g��",�=��?�RhB��q�Z��%���_�獵��Ǳ��#�$@4H���G�YR����%��@�s�>���=�W�@�DɃ�.�P<(����!���S��4O�v4R��P'KJ�_NP�y
�Hc+�34��:U4�Ȭ-�g��m(A�j%$O�t�I�'E�7��&5��+�2OX$�d���P��Yc� ��_����x��B����6         g  x���K��0���)t�²�I�N��M�e7�M��H�G��ޫG��J��U��6���õ���9I�Q�u��~=o%� �d�x����)T�]*p�e6�g,�Ӎ��ö3����0R����7�sF�G�Oh#~��w���$���%��y���d�s��J�b���I��)s�A����t����gJ�"y�Ʉk���G�e�0I���2S���Qw��Lʍ�
k�ڽq{8WF�X�&��G{��](Qƞ�K����ϔe�~����UVg5/w�%��<wX��h/��W�_�~4���K��
ߵp��Y	5��&u�Q��5�Iӻ�����`�|�tO�x�4p:�s�]c>�1�� np�t      	   �  x��V=�d��ߜ�`d�;�!��&,)��۽����S(����]-��p0�n��z��G�y��z���^��yx՚{�h3����*>B�Z�m����[i�}�`2�k�R���^:��x�L���GT�}����Ѧis��+vt�f��-��3G�&l�f<f�1ת��(���V;_;�2Q�k�ֻ�Y�D먿׽Z��(�ʐ�n�=S�X�������v���|��l�/;.�y�dO��˯���w��˗K|������O���×��כ=·��o�n�o����r���]~y����������~���j��R鰇y|�r��s��U+����\hgK��ф�E�:�H���L�9�5���ڲ�5�\�[�iѨ	��ZѽyᐘpЬ�gU�u�ILҬ%�]6���1��;�P�z�]�J��2>L坴�$k��z
-�V�[��.��O�f�㖽��?�ˏ���� �O�]^?}�?�����%����K���譴���z�?���z�Q���R��ږ�Tbh���,(Z{6��Rf�>V�q-�Vp� ��E/�8kc�I�V6�D�)R���ƥ�)1=4y&�Zt���5�K�Mn�ݷ�{�̾W'7��P(�;]75�:���HGͭ��%�s��;�O�[�i�Kb�A�mG��T�K;�;�A�k@]��Mj]hvzm	w�$�[�\�9!��c��7�X��NUT��7�5��1�GLh�� ���iǆ	�kL�B&s ���$)�7t���:��ep.S(��qW��jB��M����;tm�H�Q$ד����l>�Oi�������������؏�?����"��*�6A�ȂY7�A�Ԇhm>
��HEmB���kgU|�WtU� F�Ŀ�@��e�k@~u�Z)i`�Z��m� /��f�w��	�9>+��.t��_�u�2
85xy�ڀt�$
8V��#���;�������	j_�PPdC>�l��,Ǘ��y��r�����R&��X��X=�0D�����|��m�W�A��81-VQ<� �zgu$�J�Z������Q���]:�9N5����0�L�U��c�˳�����w!3+�5#��f�yEߔ���W¦�7��ar!I1%1D�Sgڻ4��#�v���NЄ�����'b�;br��"��7+B�fJ�ثY�L�QR��D�0�G�l�6ո"t�)�V6q�:��U�t*��;�1��a�I�5vM�ׂ�@�N�����"�M �X��k���Q�XF�p@VmB��E�"�D�*:��;���jǜ`���_ǸLd������K ����%nB�����<�pݴ#����E�����h�v�('�277���	��I��a����d����(�I���l: �@'�]]}R�;0����F8(!�t!��ʢ�v�'�����I]P@��P�n�P��Sc�b�*؜����y�����YX[�L/�7����/���Xa�f,@��D��܃��-g:a$+2}����=�Y�	�	t��������6Kab3�p]�GL���H�S��1nA��s(:���Yl"��&���?�H^0Dl"+Fۘ (��z�u��a./X"���Q0�@f̎UѠ�>���+��������S;���__^^��"�     