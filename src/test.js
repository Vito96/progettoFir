import React, {
    Component
} from 'react';
import './css/Graph.css';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import _ from 'lodash';
import { Button, Grid, Row, Col, Modal , Table, Glyphicon } from 'react-bootstrap';


class Graph extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            linkedRouter: '',
            linkedRouterFrom: '',
            delay: '',
            weight: '',
            from: '',
            verso: '',
            weightPacket: '',
            show: false
        }
        this.packets = [];
        this.finalPacket = [];
        this.data = {
            "nodes": [],
            "links": []
        }

        this.createGraph = () => new window.Diagram('#diagram', this.data, {positionCache: true}).init('interface', 'loopback');

        this.update = (name, target, delay, weight) => {
            let trovato = false;
            this.data.links.forEach(link => {
                if (link.source === target) trovato = true;
            })
            if (trovato) {
                this.data.links.push({
                    "source": name,
                    "target": target,
                    delay: Number(delay) / 1000,
                    weight: Number(weight)
                })
            } else {
                this.data.links.push({
                    "source": target,
                    "target": name,
                    delay: Number(delay),
                    weight: Number(weight),
                })
            }

            const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
            list.removeChild(list.childNodes[0]);
            this.createGraph();
            this.options.push({
                value: name,
                label: name
            })
        }

        this.aggiungiPacchetti = () => {
            this.packets.push({
                from: this.state.from,
                to: this.state.verso,
                weightPacket: Number(this.state.weightPacket)
            });
            this.setState({
                from: '',
                verso: '',
                weightPacket: ''
            });
        }

        this.visualizzaPacchetti = () => {
            this.setState({
                showModalPackets: true
            });
        };

        this.deletePacket = (obj, idx) => {
            _.remove(this.packets, (packet, index) => {
                return index === idx;
            })
            this.forceUpdate();
        };

        const returnNode = (name, dataWork) => {
            let currentlyNode = undefined
            dataWork.nodes.forEach((node) => {
                if (node.name ===  name) currentlyNode = node;
            });
            return Object.assign({}, currentlyNode);
        }


        this.calcola = (p, nameFather, dataWork) => {
            const currentlyNode = returnNode(p, dataWork);
            if (currentlyNode.packets.length === 0) {
                const childNodeObject = returnChild(currentlyNode.name)
                const childNodeArray = [];
                _.forEach(childNodeObject, (child, key) => {
                    if (key !== nameFather) childNodeArray.push(returnNode(key, dataWork));
                });
                childNodeArray.forEach(child => {
                    this.calcola(child.name, currentlyNode.name, dataWork).forEach(packet => {
                        currentlyNode.packets.push(packet);
                    });
                })
                _.orderBy(currentlyNode.packets, ['timeSent']);
                if (nameFather === undefined) return _.filter(currentlyNode.packets, packet => {
                    return packet.to === currentlyNode.name;
                });
                let lastExecution = 0;
                currentlyNode.packets.forEach((packet, index) => {
                    let percorsoAttuale = undefined;

                    let isForFather = false
                    for(let i = 0; i< packet.percorso.length; i++) {
                        if (packet.percorso[i] === currentlyNode.name && packet.percorso[i + 1] === nameFather) {
                            isForFather = true;
                        }
                    }

                    if (!isForFather) {
                        return;
                    }

                    _.forEach(dataWork.links, link => {
                        if (link.target === nameFather && link.source === currentlyNode.name) {
                            percorsoAttuale = link;
                        } else if (link.source === nameFather && link.target === currentlyNode.name) {
                            percorsoAttuale = link;
                        }
                    })
                    //Calcolo costo di elaborazione nel nodo
                    if (lastExecution > packet.timeSent) {
                        packet.time = lastExecution + packet.weightPacket / percorsoAttuale.weight;
                        lastExecution = packet.time;
                        packet.timeSent = packet.time + percorsoAttuale.delay;
                    } else {
                        //Calcolo costo di elaborazione nel nodo
                        packet.time = packet.timeSent + packet.weightPacket / percorsoAttuale.weight;
                        lastExecution = packet.time;
                        //calcolo costo di propagazione verso il nodo successivo;
                        packet.timeSent = packet.time + percorsoAttuale.delay;
                    }
                });
                return currentlyNode.packets;
            } else {
                let lastExecution = 0;
                currentlyNode.packets.forEach(packet => {
                    let percorsoAttuale = undefined;
                    _.forEach(dataWork.links, link => {
                        if (link.target === nameFather && link.source === currentlyNode.name) {
                            percorsoAttuale = link;
                        } else if (link.source === nameFather && link.target === currentlyNode.name) {
                            percorsoAttuale = link;
                        }
                    })

                    //Calcolo costo di elaborazione nel nodo
                    packet.time = lastExecution + packet.weightPacket / percorsoAttuale.weight;
                    lastExecution = packet.time;
                    //calcolo costo di propagazione verso il nodo successivo;
                    packet.timeSent = packet.time + percorsoAttuale.delay;
                });
                return currentlyNode.packets;
            }

        };

        const returnChild = node => {
            const child = {}
            _.forEach(this.data.links, link =>  {
                if (link.target === node) {
                    child[link.source] = 1;
                } else if (link.source === node) {
                    child[link.target] = 1;
                }
            });
            return child;
        }
        const retrievePercorso = (from, to) => {
            //Tirare fuori creazione mappa
            const map = {}
            _.forEach(this.data.nodes, node => {
                map[node.name] = returnChild(node.name)
            });
            const graph = new window.Dijkstra(map);

            return graph.findShortestPath(from, to);
        }

        this.organizzaPacchetti = () => {
            this.destinationPacket = [];
            const dataWork = _.cloneDeep(this.data);
            this.packets.forEach((p, index) => {
                p.percorso = retrievePercorso(p.from, p.to);
                dataWork.nodes.forEach((node) => {
                    if (node.name ===  p.from) {
                        node.packets.push(p);
                    }
                });
                let boolean = false
                this.destinationPacket.forEach(d => {
                    if (d === p.to) boolean = true;
                });
                if (boolean ===  false) this.destinationPacket.push(p.to);
            });
            this.finalPacket = [];
            this.destinationPacket.forEach(d => {
                this.finalPacket = this.finalPacket.concat(this.calcola(d, undefined, _.cloneDeep(dataWork)));
            });
            this.setState({
                show: true
            });
            this.forceUpdate();
        }


        this.handleChange = this.handleChange.bind(this);
        this.handleChangeSelect = this.handleChangeSelect.bind(this);
        this.retrieveOptions = this.retrieveOptions.bind(this);
        this.addNode = this.addNode.bind(this);
        this.handleChangeFrom = this.handleChangeFrom.bind(this);
        this.handleChangeVerso = this.handleChangeVerso.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleHidePackets = this.handleHidePackets.bind(this);


        this.options = [{
            "value": "A",
            "label": "A"
        }];
    }

    addNode() {
        const name = this.state.name;
        this.data.nodes.push({
            name,
            "packets": []
        })
        const list = document.getElementById("diagram"); // Get the <ul> element with id="myList"
        list.removeChild(list.childNodes[0]);
        this.createGraph();
        this.options.push({
            value: name,
            label: name
        })
        this.setState({
            name: '',
            linkedRouter: '',
        });

    }

    retrieveOptions() {
        const object = [];
        for (let i = 0; i++; i = this.data.nodes.length) {
            object.push({
                value: this.data.nodes[i].name,
                name: this.data.nodes[i].name
            })
        }
    }


    handleChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value.toUpperCase()
        });
    }

    handleChangeSelect(event) {
        this.setState({
            linkedRouter: event.value
        });
    }

    handleChangeFrom(event) {
        this.setState({
            from: event.value
        });
    }

    handleChangeVerso(event) {
        this.setState({
            verso: event.value
        });
    }

    componentDidMount() {
        this.createGraph();
    }

    handleHide() {
        this.setState({
            show: false
        });
    }

    handleHidePackets() {
        this.setState({
            showModalPackets: false
        });
    }

    render() {
        let listItems = null;
        if (this.finalPacket.length > 0) {
            listItems = this.finalPacket.map((item, index) => {
                return (
                    <tr key={index}>
                        <td>{item.from}</td>
                        <td>{item.to}</td>
                        <td>{item.timeSent}</td>
                    </tr>);
            });
        } else {
            listItems = <tr key={1}>
                <td>
                    Nessun pacchetto inserito
                </td>
            </tr>;;
        }

        let listPackets = null;

        if (this.packets.length > 0) {
            listPackets = this.packets.map((item, index) => {
                return (
                    <tr key={index}>
                        <td>{item.from}</td>
                        <td>{item.to}</td>
                        <td>{item.weightPacket}</td>
                        <td onClick={ () => this.deletePacket(item, index)}><Glyphicon glyph="trash" /></td>

                    </tr>);
            });
        } else {
            listPackets =  <tr key={1}>
                <td>
                    Nessun pacchetto inserito
                </td>
            </tr>;
        }


        let options = this.options;
        return (<div>
            <div className="diagramClass" id="diagram"></div>
            <Grid>
                <Row>
                    <Col sm={4}> Nome router:</Col>
                    <Col sm={8}>
                        <input type="text" name="name" value={ this.state.name } onChange={ this.handleChange } />
                    </Col>
                </Row>
            </Grid>
            <Button onClick={ this.addNode }> Aggiungi nodo</Button>
            <Grid>
                <Row>
                    <Col sm={4}> Capacità link ( in Bit al secondo):
                    </Col>
                    <Col sm={8}>
                        <input type="number" name="weight" value={ this.state.weight } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Ritardo di propagazione da router collegato (in secondi):
                    </Col>
                    <Col sm={8}>
                        <input type="number" name="delay" value={ this.state.delay } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Collegato da:
                    </Col>
                    <Col sm={8}>
                        <Select name="linked-router" value={ this.state.linkedRouterFrom } onChange={ this.handleChangeSelect } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Collegato a:
                    </Col>
                    <Col sm={8}>
                        <Select name="linked-router" value={ this.state.linkedRouter } onChange={ this.handleChangeSelect } options={ options } />
                    </Col>
                </Row>
            </Grid>
            <Button onClick={ this.addNode }> Aggiungi</Button>

            <Grid>
                <Row>
                    <Col sm={4}> Pacchetto da:
                    </Col>
                    <Col sm={8}>
                        <Select name="from" value={ this.state.from } onChange={ this.handleChangeFrom } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Destinazione:

                    </Col>
                    <Col sm={8}>
                        <Select name="verso" value={ this.state.verso } onChange={ this.handleChangeVerso } options={ options } />
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}> Peso pacchetto in bit:

                    </Col>
                    <Col sm={8}>
                        <input type="number" name="weightPacket" value={ this.state.weightPacket } onChange={ this.handleChange } />
                    </Col>
                </Row>
                <Row>
                    <Button onClick={ this.aggiungiPacchetti }> Aggiungi Pacchetto</Button>
                    <Button onClick={ this.visualizzaPacchetti }> Visualizza Pacchetti inseriti</Button>

                </Row>
            </Grid>
            <Button onClick={ this.organizzaPacchetti }> Calcola</Button>

            <Modal
                show={this.state.show}
                onHide={this.handleHide}
                container={this}
                aria-labelledby="contained-modal-title">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title">
                        Dati Pacchetti
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Nodo sorgente</th>
                            <th>Nodo destinazione</th>
                            <th>Tempo totale</th>
                        </tr>
                        </thead>
                        <tbody>
                        {listItems}
                        </tbody>

                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleHide}>Chiudi</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={this.state.showModalPackets}
                onHide={this.handleHidePackets}
                container={this}
                aria-labelledby="contained-modal-title">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title">
                        Pacchetti inseriti
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Nodo sorgente</th>
                            <th>Nodo destinazione</th>
                            <th>Peso Pacchetto</th>
                            <th>Elimina pacchetto</th>

                        </tr>
                        </thead>
                        <tbody>
                        {listPackets}
                        </tbody>

                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleHidePackets}>Chiudi</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={this.state.showModalPackets}
                onHide={this.handleHidePackets}
                container={this}
                aria-labelledby="contained-modal-title">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title">
                        Pacchetti inseriti
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Nome nodo</th>
                            <th>Collegato a:</th>
                            <th>Link </th>
                            <th>Elimina pacchetto</th>

                        </tr>
                        </thead>
                        <tbody>
                        {listPackets}
                        </tbody>

                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleHidePackets}>Chiudi</Button>
                </Modal.Footer>
            </Modal>
        </div>);
    }
}

export default Graph;